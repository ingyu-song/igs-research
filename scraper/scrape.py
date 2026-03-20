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
            articles.append({"title": title, "summary": desc, "url": link})
        return articles
    except Exception as e:
        print(f"네이버 검색 오류 ({keyword}): {e}")
        return []

def classify_with_claude(articles):
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    results = []
    today = datetime.now().strftime("%Y.%m.%d")

    for article in articles:
        prompt = f"""다음 기사가 기업 인수합병(M&A) 또는 사모펀드(PE) 딜 기사인지 판단해줘.

제목: {article['title']}
요약: {article['summary']}

포함 조건:
- PE/사모펀드의 기업 인수, 매각(엑싯), LBO, 세컨더리, 블록딜
- 일반 기업간 M&A (전략적 인수, 경영권 매각 등)
- 한국 기업 또는 한국 PE 관련 딜
- 딜 대상 회사가 명확히 언급된 기사

제외 조건:
- VC/스타트업 투자 라운드
- 단순 주가/시황/랠리 기사
- 주주환원/배당/자사주 소각 기사
- 이사회/사외이사/임원 인사 기사
- 노조/파업/의결권 행사 기사
- 딜 대상 회사가 명확하지 않은 기사
- 언론사 소개나 인물 프로필 기사

관련이면 아래 JSON만 출력 (다른 말 없이), 아니면 SKIP만 출력:
{{
  "date": "{today}",
  "title": "{article['title'][:60]}",
  "summary": "딜 핵심 내용 1-2문장. 인수자, 피인수자, 딜 성격 포함",
  "type": "acq 또는 exit 또는 lbo 또는 sec",
  "tags": ["type값"],
  "ev": "딜 규모 (없으면 null)"
}}"""

        try:
            message = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=400,
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
                results.append(deal)
                print(f"✓ {deal['title']}")
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
    print("네이버 뉴스 검색 중...")
    articles = []
    seen = set()

    for keyword in KEYWORDS:
        found = fetch_naver_news(keyword, display=20)
        new = [a for a in found if a["title"] not in seen]
        seen.update(a["title"] for a in new)
        articles.extend(new)
        print(f"  '{keyword}': {len(new)}개")

    print(f"\n총 {len(articles)}개 기사 수집됨\n")

    print("Claude 분류 중...")
    deals = classify_with_claude(articles)

    print("\ndeals.json 업데이트 중...")
    update_deals(deals)
