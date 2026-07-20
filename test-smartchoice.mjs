// Node.js has native fetch, no import needed.

const apiKey = "8dccb43b00";
const baseUrl = "http://api.smartchoice.or.kr/api/openAPI.xml";

// 테스트용 입력 조건 (통화 100분, 데이터 10GB(10240MB), 문자 50건, 성인(20), 5G(6), 24개월약정)
const params = {
  authkey: apiKey,
  voice: "100",
  data: "10240",
  sms: "50",
  age: "20",
  type: "6",
  dis: "24"
};

const url = `${baseUrl}?${new URLSearchParams(params)}`;

// XML 태그 추출을 위한 간단한 정규식 파서
function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function extractAllTags(xml, tag) {
  const results = [];
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  let m;
  while ((m = regex.exec(xml)) !== null) {
    results.push(m[1].trim());
  }
  return results;
}

async function testApi() {
  console.log(`Sending request to: ${url}\n`);
  
  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/xml, text/xml"
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    
    const xmlText = await response.text();
    console.log("=== RAW XML RESPONSE ===");
    console.log(xmlText);
    console.log("========================\n");
    
    const resultCode = extractTag(xmlText, "result_code");
    const resultCount = extractTag(xmlText, "result_count") || extractTag(xmlText, "result_date");
    
    console.log(`Result Code: ${resultCode}`);
    console.log(`Result Count: ${resultCount}\n`);
    
    const items = extractAllTags(xmlText, "item");
    const plans = items.map(item => ({
      planName: extractTag(item, "v_plan_name") || "N/A",
      telecom: extractTag(item, "v_tel") || "N/A",
      monthlyFee: parseInt(extractTag(item, "v_plan_price") || "0", 10),
      data: extractTag(item, "v_plan_display_data") || "N/A",
      voice: extractTag(item, "v_plan_display_voice") || "N/A",
      sms: extractTag(item, "v_plan_display_sms") || "N/A",
      link: "https://www.smartchoice.or.kr"
    }));
    
    console.log("=== PARSED PLANS (JSON) ===");
    console.log(JSON.stringify({
      success: true,
      resultCode,
      count: plans.length,
      plans
    }, null, 2));
    
  } catch (error) {
    console.error("API Request Failed:", error);
  }
}

testApi();
