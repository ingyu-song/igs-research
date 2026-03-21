import requests
import json
import os
from datetime import datetime
from bs4 import BeautifulSoup
import anthropic

KEYWORDS = [
    "사모펀드 인수", "사모펀드 매각", "PEF 인수", "바이아웃",
    "MBK Partners 인수", "한앤컴퍼니 인수", "IMM PE",
    "어피니티 매각", "경영권 인수 사모", "블록딜 사모펀드",
    "기업 인수 PE", "M&A 사모펀드", "경영권 매각"
]

TEST_MODE = os.environ.get("TEST_MODE", "false").lower() == "true"
DISPLAY = 3 if TEST_MODE else 20

def parse_naver_date(pub_date):
    try:
        from email.utils import parsedate
        from time import mktime
        t = parsedate(pub_date)
        if t:
            dt = datetime.fromtimestamp(mktime(t))
            return dt.strftime("%Y.%m.%d")
    except:
        pass
    return datetime.now().strftime("%Y.%m.%d")

def fetch_naver_news(keyword, display=20):
    url = "https://openapi.naver.com/v1/search/news.json"
    headers = {
        "X-Naver-Client-Id": os.environ.get("NAVER_CLIENT_ID", ""),
        "X-Naver-Client-Secret": os.environ.get("NAVER_CLIENT_SECRET", "")
    }
    params = {"query": keyword, "display": display, "sort": "date"}
    try:
        res = requests.get(url, headers=headers, params=params, timeout=10)
        data = res.json()
        articles = []
        for item in data.get("items", []):
            title = BeautifulSoup(item["title"], "html.parser").get_text()
            desc = BeautifulSoup(item["description"], "html.parser").get_text()
            link = item.get("originallink") or item.get("link", "")
            pub_date = parse_naver_date(item.get("pubDate", ""))
            articles.append({"title": title, "summary": desc, "url": link, "date": pub_date})
        return articles
    except Exception as e:
        print(f"네이버 검색 오류 ({keyword}): {e}")
        return []

def classify_with_claude(articles):
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    results = []

    for article in articles:
        prompt = f"""당신은 한국 PE/M&A 딜 분류 전문가입니다.
아래 기사가 실제 PE/M&A 딜 기사인지 판단하십시오.

제목: {article['title']}
요약: {article['summary']}

---

[포함 기준 — 아래 3가지를 모두 충족해야 포함]
1. 인수자(acquirer) 또는 매각자가 기사에 명시되어 있음
2. 딜 대상 회사(company)가 기사에 명시되어 있음
3. 딜이 신규로 발표·추진·완료된 거래임 (이미 알려진 딜의 사후 동향 기사 제외)

포함되는 딜 유형:
- PE/사모펀드의 기업 인수 (Buyout/Acquisition)
- PE의 기업 매각 또는 엑싯 (Exit)
- LBO (차입매수)
- 세컨더리 거래
- 블록딜 (PE 보유 지분 매각, 단 상장 직후 소규모 차익 실현은 제외)
- 전략적 M&A (기업 간 경영권 인수·매각)

---

[제외 기준 — 하나라도 해당하면 SKIP]
- VC/스타트업 투자 라운드 (시리즈A, 시리즈B 등)
- 주가·시황·수급 분석 기사 (예: "보호예수 해제 후 오버행 우려", "주가 랠리")
- 상장 직후 소규모 지분 정리 (전체 지분의 2% 미만, 딜 성격 없음)
- 주주환원·배당·자사주 소각
- 이사회·사외이사·임원 인사·조직 개편
- 노조·파업·의결권 행사·주주총회 분쟁 (경영권 분쟁이 메인인 기사)
- PE 소유 구조를 배경 지식으로만 설명하는 칼럼·분석 기사 (실제 진행 중인 딜 없음)
- PE 포트폴리오 회사의 가격 인상·경영 전략·소비자 이슈 기사 (PE는 배경으로만 등장)
- 기존 딜 완료 이후의 사후 동향 (예: "인수 후 실적", "엑싯 후 주가 흐름")
- 언론사 소개·인물 프로필·수상 기사
- 딜 대상 회사 또는 인수자가 불명확한 기사

---

판단 후, 포함이면 아래 JSON만 출력 (설명 없이), 제외이면 SKIP만 출력.

포함 시 JSON 형식:
{{
  "title": "{article['title'][:60]}",
  "summary": "딜 핵심 내용 1-2문장. 반드시 인수자, 피인수자, 딜 성격을 포함할 것",
  "company": "딜 대상 회사명 (인수/매각 대상이 되는 회사. 한글 공식명. 예: 한국타이어앤테크놀로지). 인수자·PE펀드·증권사가 아닌 타깃 회사만 기재. 불명확하면 null",
  "acquirer": "인수자 또는 PE펀드명 (예: MBK파트너스). 매각 기사인 경우 기존 보유자",
  "type": "acq | exit | lbo | sec | block | strategic",
  "tags": ["type값"],
  "ev": "딜 규모 (예: 1.2조원). 불명확하면 null",
  "deal_stage": "소문 | 협상 | 계약 | 완료"
}}"""

        try:
            message = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}]
            )
            response = message.content[0].text.strip()
            if response.upper() == "SKIP":
                continue
            start = response.find("{")
            end = response.rfind("}") + 1
            if start != -1 and end != 0:
                deal = json.loads(response[start:end])
                deal["url"] = article["url"]
                deal["date"] = article["date"]
                # company 없으면 저장 안 함
                if not deal.get("company"):
                    print(f"✗ company 없음 — 제외: {deal.get('title', '')}")
                    continue
                results.append(deal)
                print(f"✓ [{deal.get('deal_stage','?')}] {deal['company']} ← {deal.get('acquirer','?')} ({deal['type']})")
        except json.JSONDecodeError as e:
            print(f"JSON 파싱 오류: {e} | 응답: {response[:80]}")
        except Exception as e:
            print(f"분류 오류: {e}")

    return results

def update_deals(new_deals):
    deals_path = "_data/deals.json"
    try:
        with open(deals_path, "r", encoding="utf-8") as f:
            existing = json.load(f)
    except:
        existing = []

    existing_titles = {d["title"] for d in existing}
    added = [d for d in new_deals if d["title"] not in existing_titles]
    merged = added + existing
    merged = merged[:100]

    with open(deals_path, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    print(f"\n{len(added)}개 새 딜 추가됨. 총 {len(merged)}개.")

if __name__ == "__main__":
    print(f"네이버 뉴스 검색 중... ({'테스트모드' if TEST_MODE else '전체모드'})")
    articles = []
    seen = set()

    for keyword in KEYWORDS:
        found = fetch_naver_news(keyword, display=DISPLAY)
        new = [a for a in found if a["title"] not in seen]
        seen.update(a["title"] for a in new)
        articles.extend(new)
        print(f"  '{keyword}': {len(new)}개")

    print(f"\n총 {len(articles)}개 기사 수집됨\n")

    print("Claude 분류 중...")
    deals = classify_with_claude(articles)

    print("\ndeals.json 업데이트 중...")
    update_deals(deals)