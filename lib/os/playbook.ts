import type { Lang } from "../i18n";

export type MenuKey =
  | "home"
  | "sales"
  | "builder"
  | "departure"
  | "flights"
  | "suppliers"
  | "live"
  | "finance"
  | "analytics"
  | "portals"
  | "scope"
  | "agi";

export interface PlaybookStep {
  n: string;
  t: string;
  b: string;
}

export interface MenuPlaybook {
  goal: string;
  watch: string;
  ai: string;
  steps: PlaybookStep[];
}

const en: Record<MenuKey, MenuPlaybook> = {
  home: {
    goal: "See today’s departures, overdue work, unconfirmed suppliers and margin in one place — then run or continue the 40-pax Golden Triangle inbound demo.",
    watch: "Amber items are not booked. Do not treat indicative overtime or walk-up rooms as confirmed cost.",
    ai: "Ask the OS: “show margin”, “what is overdue”, “run the demo”.",
    steps: [
      { n: "1", t: "Read the four-box impact strip", b: "What happened, why it matters, money, next action — approve from here when a pack is pending." },
      { n: "2", t: "Clear urgent deadlines first", b: "Name list, hotel release, missing passports and customer balance are time-zoned. ICT ≠ China CST on the inbound block." },
      { n: "3", t: "Open the live departure", b: "Click today’s Golden Triangle inbound group to work passengers, flights and suppliers on the same file." },
      { n: "4", t: "Use the demo buttons in order", b: "Add 5 passengers → delay CZ3051 → approve → close. Reset only if you need a clean file." },
    ],
  },
  sales: {
    goal: "Turn a website, group, marketplace or Agent Direct enquiry into a structured brief, quote versions and a won departure.",
    watch: "A brief is not a booking. Channel fee (marketplace 8%, Agent Direct 1.5%) only applies after seats are allocated.",
    ai: "Ask: “create a brief”, “compare quote versions”, “why margin changed”.",
    steps: [
      { n: "1", t: "Capture the enquiry", b: "Source channel, pax, budget, destination and follow-up owner must be filled before AI drafts a product." },
      { n: "2", t: "Edit the AI brief", b: "Correct pax, shopping rule, hotel class and sell price. Apply the draft to records — do not leave it in the command bar." },
      { n: "3", t: "Issue quote versions", b: "Keep v1 as the cost draft and v2 as the client proposal. Never overwrite a sent version." },
      { n: "4", t: "Mark won and attach a departure", b: "Winning a quote creates or links the dated workspace. Sales stops owning inventory after that." },
    ],
  },
  builder: {
    goal: "Build a reusable tour product: day plan, supplier picks, passenger-based price, supplements and a live margin against the target.",
    watch: "Unconfirmed services stay amber. Child 75%, single supplement and FOC 1/16 are assumptions until a contract says otherwise.",
    ai: "Ask: “Tour Producer”, “itemise costing”, “what is still unconfirmed”.",
    steps: [
      { n: "1", t: "Lock the product, not the date", b: "Template code, min pax, capacity and margin target belong to the product. Dates live on the departure." },
      { n: "2", t: "Place services on days", b: "Flights, hotels, meals and attractions must sit on a day so Change Impact can move them later." },
      { n: "3", t: "Read live costing while you edit", b: "Sell, cost and margin update from service lines. If margin < target, change rate class or sell — do not hide the gap." },
      { n: "4", t: "Save assumptions in the box", b: "Named hotels, no shopping, FOC rules. These travel with every quote version." },
    ],
  },
  departure: {
    goal: "Operate one dated file: passengers, flights, coaches, rooms, meals, activities, guides, documents and finance on the same identifiers.",
    watch: "Passenger count, flight time or itinerary changes must run through Change Impact before you move inventory.",
    ai: "Ask: “add 5 passengers”, “who is not document-ready”, “what breaks if we delay arrival”.",
    steps: [
      { n: "1", t: "Use the tabs, do not split files", b: "Overview is the service list. Pax, flights, rooms and finance are the same departure — not copies." },
      { n: "2", t: "Check readiness before names go to the airline", b: "Missing passports, name mismatches and no-insurance flags must be cleared or accepted." },
      { n: "3", t: "Watch rate class", b: "Indicative → quoted → held → confirmed. Held seats have an expiry. Confirmed is the only safe ops state." },
      { n: "4", t: "Approve impacts, then confirm suppliers", b: "Adding pax or delaying a flight creates an approval pack. Do not confirm rooms or meals until it is approved." },
    ],
  },
  flights: {
    goal: "Manage group seat blocks: sold vs unsold, PNR, deposits, release / name / ticket deadlines, and whether to keep or release unused seats.",
    watch: "Unsold seats are cash exposure at unit cost. Releasing after the name-list date can still carry a penalty.",
    ai: "Ask: “keep or release unused seats”, “name-list readiness”, “walk-up vs consolidator”.",
    steps: [
      { n: "1", t: "Read the block row first", b: "Airline, route, seats, sold, PNR, names due, ticket-by, exposure. Time zones are on the block (ICT / CST)." },
      { n: "2", t: "Match names to passports", b: "Ticket status listed ≠ ticketed. Mismatched passport names will fail at submit." },
      { n: "3", t: "Honour consolidator terms", b: "Typical: 30% deposit, release T-21, names T-14. Child fare and name-change fee must be written, not assumed." },
      { n: "4", t: "Decide keep vs release with total tour cost", b: "Do not release a corporate block while add-ons are still open. Walk-up on 5 extra seats is a Change Impact, not a silent edit." },
    ],
  },
  suppliers: {
    goal: "Hold contracts and rate cards, compare equivalent offers, send reservations, collect confirmations and keep a service history.",
    watch: "Extracted rates can be wrong. Correct the field, then confirm. A supplier link only shows that one service.",
    ai: "Ask: “Supplier Buyer”, “what is missing from this offer”, “who has not acknowledged”.",
    steps: [
      { n: "1", t: "Compare like-for-like offers", b: "Same dates, same inclusions. Flag missing child fare, overtime, parking, name-change fee." },
      { n: "2", t: "Set rate class honestly", b: "PDF extract = indicative until a human ticks it. Email offer = quoted. Deposit paid = held." },
      { n: "3", t: "Send a short confirm link", b: "Restaurant and coach vendors should ack from /portal/supplier — no full OS login." },
      { n: "4", t: "Ack on the reservation row", b: "Use Acknowledge only after the supplier replied. That flips the service toward confirmed." },
    ],
  },
  live: {
    goal: "Run the trip: timeline, service readiness, incidents, recovery options and who has acknowledged the new plan.",
    watch: "A delayed arrival is not only a flight problem — meals, attractions, coaches and guides all move.",
    ai: "Ask: “Trip Simulator”, “Disruption Coordinator”, “what must be acknowledged today”.",
    steps: [
      { n: "1", t: "Read the timeline against the clock", b: "If CZ3051 is late, Doi Suthep 10:30 and lunch 12:15 fail. Use the proposed 15:30 / 13:30 times." },
      { n: "2", t: "Open the incident, do not hide it", b: "Status open → recovering → closed. Recovery cost (overtime, parking) must appear on finance." },
      { n: "3", t: "Collect acknowledgements", b: "Restaurant, attraction, coaches, client. Unticked ack means the old time is still in someone’s pocket." },
      { n: "4", t: "Push the same plan to portals", b: "Guides see the new slot on mobile. Travellers see the revised day. Do not send a second unofficial WhatsApp plan." },
    ],
  },
  finance: {
    goal: "See expected vs actual margin, customer collections, supplier payables and cash gaps on this departure.",
    watch: "Quoted margin is history. Live margin includes walk-up rooms and overtime. Collected ≠ earned.",
    ai: "Ask: “Profit Guardian”, “break-even pax”, “cash gap if balance slips”.",
    steps: [
      { n: "1", t: "Compare quote vs live cost", b: "v2 client proposal vs committed services. The gap is leakage you must explain." },
      { n: "2", t: "Age the ledger", b: "Deposit received, balance expected, TG deposit paid, hotel/coach still due. Overdue customer cash blocks supplier pay." },
      { n: "3", t: "Use break-even before cutting price", b: "If you discount, re-run break-even pax. Do not go below it without an approval." },
      { n: "4", t: "Close only when money matches ops", b: "Closing writes actual profit. All ins should be received, outs paid or accepted." },
    ],
  },
  analytics: {
    goal: "Review sales, utilisation, incidents and Tour Memory so the next Golden Triangle inbound template is better than this one.",
    watch: "Memory is advice for the next product, not a silent change to this departure.",
    ai: "Ask: “Tour Memory”, “why morning Doi Suthep fails after a late CNX arrival”.",
    steps: [
      { n: "1", t: "Read this departure’s scorecard", b: "Won enquiry, margin, capacity used, incident count, GMV." },
      { n: "2", t: "Apply memory to the next template", b: "Default day-1: old city first if late, Doi Suthep afternoon. Price driver overtime into the quote." },
      { n: "3", t: "Flag weak suppliers", b: "Late restaurant acks become a T-48h written-ack rule on the next file." },
      { n: "4", t: "Do not forecast from one trip alone", b: "Capacity Exchange and seat-demand forecasting are later-stage — not on this screen yet." },
    ],
  },
  portals: {
    goal: "Give travellers, organisers, suppliers and guides a short mobile page — not the full operator workspace.",
    watch: "Supplier links are scoped to one service. Never paste operator rates into a traveller view.",
    ai: "Ask: “what should the guide see after the delay”, “draft a client notice”.",
    steps: [
      { n: "1", t: "Traveller — itinerary and tasks", b: "Days, voucher, passport still needed, deposit vs balance." },
      { n: "2", t: "Organiser — the group list", b: "Names, rooms, missing passports. They add people; you still approve inventory." },
      { n: "3", t: "Supplier — one confirm button", b: "Headcount and new meal time only. No other departures." },
      { n: "4", t: "Guide — manifest and incidents", b: "New Doi Suthep slot, open tasks, file a delay note back into Live trip." },
    ],
  },
  scope: {
    goal: "See what TOUR24 already had, what this OS expanded, and what is still later-stage — so design and build stay on the same map.",
    watch: "Available ≠ finished. Marketplace book is live; group-flight airline APIs are not.",
    ai: "Ask: “what is first commercial release”, “is Capacity Exchange in this build”.",
    steps: [
      { n: "1", t: "Read the status chip", b: "Available = already in the marketplace. Expand = connected into the OS. New = built here. Later = not this release." },
      { n: "2", t: "Use the 40-pax scenario as the test", b: "If add-5 + delay does not move every affected service, the OS is not connected." },
      { n: "3", t: "Keep channels as channels", b: "Website, marketplace and Agent Direct sell. They do not each get a private operations file." },
      { n: "4", t: "Open Playbook on every other menu", b: "Scope is the map. Each menu’s Playbook is the working procedure." },
    ],
  },
  agi: {
    goal: "Assign a business objective to the agentic team. They plan, coordinate modules, execute inside authority, and bring you approvals.",
    watch: "AGI Mode is a separate layer from Normal AI. A finished itinerary is not a booking. Toggle off to go back to one-task help.",
    ai: "Assign: the Golden Triangle inbound 40-pax brief, then Change Once to 32, then Trip Rescue on a delay.",
    steps: [
      { n: "1", t: "Turn AGI Mode on", b: "The gold Ask AI dock at the top of the work area becomes the objective box. Playbook stays closed unless you open it." },
      { n: "2", t: "Give one command", b: "The team writes a project into Sales, Builder, Flights, Suppliers and Finance — all lines stay requested / estimate." },
      { n: "3", t: "Change once", b: "32 pax rebuilds air, rooms, bus, meals and margin. Authorize only after you read who must reconfirm." },
      { n: "4", t: "Rescue or take over", b: "A delay opens recovery options. Low-cost moves can run inside spend limit. Pause or take over at any time." },
    ],
  },
};

const th: Record<MenuKey, MenuPlaybook> = {
  home: {
    goal: "ดูรอบเดินทางวันนี้ งานค้าง ซัพพลายเออร์ที่ยังไม่ยืนยัน และมาร์จิ้นในหน้าเดียว แล้วรันเดโมอินบาวด์สามเหลี่ยมทองคำ 40 คน",
    watch: "รายการสีเหลืองยังไม่จอง อย่าคิดว่าล่วงเวลาหรือห้องราคาเดินเป็นต้นทุนที่ยืนยันแล้ว",
    ai: "ถามระบบ: “ดูมาร์จิ้น”, “อะไรเกินเดดไลน์”, “รันเดโม”",
    steps: [
      { n: "1", t: "อ่านกล่องผลกระทบสี่ช่อง", b: "เกิดอะไร ทำไมสำคัญ เงิน ขั้นถัดไป — อนุมัติจากที่นี่เมื่อมีแพ็กค้าง" },
      { n: "2", t: "เคลียร์เดดไลน์ด่วนก่อน", b: "รายชื่อไฟลต์ ปล่อยห้อง พาสปอร์ตขาด ยอดลูกค้า — โซนเวลา ICT ≠ เวลาจีนบนบล็อกขาเข้า" },
      { n: "3", t: "เปิดรอบเดินทางที่กำลังทำ", b: "คลิกกรุ๊ปอินบาวด์สามเหลี่ยมทองคำวันนี้ เพื่อทำผู้โดยสาร ไฟลต์ และซัพพลายเออร์ในไฟล์เดียว" },
      { n: "4", t: "กดปุ่มเดโมตามลำดับ", b: "เพิ่ม 5 คน → ดีเลย์ CZ3051 → อนุมัติ → ปิดทริป รีเซ็ตเมื่อต้องการไฟล์สะอาด" },
    ],
  },
  sales: {
    goal: "รับงานจากเว็บ กลุ่ม มาร์เก็ตเพลส หรือ Agent Direct แล้วทำบรีฟ ใบเสนอหลายฉบับ และรอบเดินทางที่ชนะ",
    watch: "บรีฟยังไม่ใช่การจอง ค่าช่องทางคิดเมื่อจัดที่นั่งแล้วเท่านั้น",
    ai: "ถาม: “สร้างบรีฟ”, “เทียบใบเสนอ”, “มาร์จิ้นเปลี่ยนทำไม”",
    steps: [
      { n: "1", t: "จับงานให้ครบ", b: "ช่องทาง จำนวนคน งบ ปลายทาง และเจ้าของติดตาม ต้องมีก่อนให้ AI ร่างสินค้า" },
      { n: "2", t: "แก้บรีฟ AI แล้วใส่ลงเรคคอร์ด", b: "แก้จำนวนคน กฎร้านช้อป ระดับโรงแรม ราคาขาย — อย่าทิ้งไว้ที่แถบคำสั่ง" },
      { n: "3", t: "ออกใบเสนอเป็นเวอร์ชัน", b: "v1 ต้นทุน v2 ส่งลูกค้า ห้ามทับฉบับที่ส่งแล้ว" },
      { n: "4", t: "ชนะงานแล้วผูก departure", b: "หลังชนะ คลังสินค้าอยู่ที่รอบเดินทาง ฝ่ายขายไม่ถือของเอง" },
    ],
  },
  builder: {
    goal: "สร้างเทมเพลตทัวร์ที่ใช้ซ้ำได้: รายวัน ซัพพลายเออร์ ราคาต่อคน ส่วนเสริม และมาร์จิ้นสดเทียบเป้า",
    watch: "บริการที่ยังไม่ยืนยันเป็นสีเหลือง ส่วนเด็ก 75% ห้องเดี่ยว และ FOC 1/16 เป็นสมมติฐานจนกว่าสัญญาจะระบุ",
    ai: "ถาม: “Tour Producer”, “แยกต้นทุน”, “อะไรยังไม่ยืนยัน”",
    steps: [
      { n: "1", t: "ล็อกสินค้า ไม่ล็อกวัน", b: "รหัสเทมเพลต คนขั้นต่ำ ความจุ เป้ามาร์จิ้นอยู่ที่สินค้า วันที่อยู่ที่รอบเดินทาง" },
      { n: "2", t: "วางบริการลงวัน", b: "ไฟลต์ โรงแรม อาหาร กิจกรรมต้องอยู่บนวัน เพื่อให้ Change Impact ขยับได้" },
      { n: "3", t: "ดูต้นทุนสดขณะแก้", b: "ถ้ามาร์จิ้นต่ำกว่าเป้า ให้ปรับเรทหรือราคาขาย ห้ามซ่อนช่องว่าง" },
      { n: "4", t: "เก็บสมมติฐานในกล่อง", b: "โรงแรมมีชื่อ ไม่ลงร้าน กฎ FOC — ติดไปกับทุกใบเสนอ" },
    ],
  },
  departure: {
    goal: "ทำงานบนไฟล์วันที่เดียว: ผู้โดยสาร ไฟลต์ รถ ห้อง อาหาร กิจกรรม ไกด์ เอกสาร การเงิน รหัสเดียวกัน",
    watch: "เปลี่ยนจำนวนคน เวลาบิน หรือโปรแกรม ต้องผ่าน Change Impact ก่อนขยับของ",
    ai: "ถาม: “เพิ่ม 5 คน”, “ใครเอกสารไม่ครบ”, “ดีเลย์ขาเข้าแล้วอะไรพัง”",
    steps: [
      { n: "1", t: "ใช้แท็บ อย่าแยกไฟล์", b: "ภาพรวมคือรายการบริการ ผู้โดยสาร ไฟลต์ ห้อง การเงิน คือ departure เดียวกัน" },
      { n: "2", t: "เช็กความพร้อมก่อนยื่นชื่อสายการบิน", b: "พาสปอร์ตขาด ชื่อไม่ตรง ไม่มีประกัน ต้องเคลียร์หรือรับความเสี่ยง" },
      { n: "3", t: "ดูระดับราคา", b: "ประมาณ → ใบเสนอ → ถือของ → ยืนยัน ที่นั่งที่ถือมีวันหมด ยืนยันแล้วเท่านั้นที่ปฏิบัติการได้" },
      { n: "4", t: "อนุมัติผลกระทบแล้วค่อยให้ซัพพลายเออร์คอนเฟิร์ม", b: "เพิ่มคนหรือดีเลย์ไฟลต์จะสร้างแพ็กอนุมัติ อย่าคอนเฟิร์มห้อง/อาหารก่อนอนุมัติ" },
    ],
  },
  flights: {
    goal: "จัดการบล็อกที่นั่งกลุ่ม: ขายแล้ว/เหลือ PNR มัดจำ เดดไลน์ปล่อย ยื่นชื่อ ออกตั๋ว และตัดสินใจถือหรือปล่อยที่นั่งว่าง",
    watch: "ที่นั่งว่างคือความเสี่ยงเงินสดตามต้นทุนต่อที่ ปล่อยหลังวันยื่นชื่ออาจยังมีค่าปรับ",
    ai: "ถาม: “ถือหรือปล่อยที่นั่งว่าง”, “รายชื่อพร้อมหรือยัง”, “ราคาเดินกับคอนโซ”",
    steps: [
      { n: "1", t: "อ่านแถวบล็อกก่อน", b: "สายการบิน เส้นทาง ที่นั่ง ขายแล้ว PNR ยื่นชื่อ ออกตั๋ว ความเสี่ยง โซนเวลาบนบล็อก" },
      { n: "2", t: "จับชื่อให้ตรงพาสปอร์ต", b: "สถานะ listed ยังไม่ใช่ ticketed ชื่อพาสปอร์ตไม่ตรงจะยื่นไม่ผ่าน" },
      { n: "3", t: "ทำตามเงื่อนไขคอนโซ", b: "มัดจำ 30% ปล่อย T-21 ยื่นชื่อ T-14 ค่าเด็กและค่าเปลี่ยนชื่อต้องมีเป็นลายลักษณ์อักษร" },
      { n: "4", t: "ตัดสินใจถือ/ปล่อยจากต้นทุนทั้งทัวร์", b: "อย่าปล่อยบล็อกองค์กรถ้ายังมีคนเพิ่ม ราคาเดิน 5 ที่คือ Change Impact ไม่ใช่แก้เงียบ" },
    ],
  },
  suppliers: {
    goal: "เก็บสัญญาและเรทการ์ด เทียบข้อเสนอ ส่งจอง เก็บการยืนยัน และประวัติบริการ",
    watch: "เรทที่ดึงจากเอกสารอาจผิด แก้ช่องแล้วค่อยยืนยัน ลิงก์ซัพพลายเออร์เห็นแค่บริการนั้น",
    ai: "ถาม: “Supplier Buyer”, “ข้อเสนอนี้ขาดอะไร”, “ใครยังไม่ตอบรับ”",
    steps: [
      { n: "1", t: "เทียบของที่เทียบกันได้", b: "วันเดียวกัน ของรวมเดียวกัน ทำเครื่องหมายถ้าขาดค่าเด็ก ล่วงเวลา ที่จอด ค่าเปลี่ยนชื่อ" },
      { n: "2", t: "ตั้งระดับราคาให้ตรงจริง", b: "ดึงจาก PDF = ประมาณ จดหมายเสนอ = ใบเสนอ จ่ายมัดจำ = ถือของ" },
      { n: "3", t: "ส่งลิงก์ยืนยันสั้น", b: "ร้านอาหารและรถตอบจาก /portal/supplier ไม่ต้องเข้า OS เต็ม" },
      { n: "4", t: "กดตอบรับเมื่อเขาตอบแล้ว", b: "Acknowledge หลังซัพพลายเออร์ตอบ จบแล้วสถานะจะเดินไปยืนยัน" },
    ],
  },
  live: {
    goal: "คุมทริปสด: ไทม์ไลน์ ความพร้อม อุบัติการณ์ แผนกู้ และใครตอบรับแผนใหม่แล้ว",
    watch: "ไฟลต์ดีเลย์ไม่ใช่เรื่องบินอย่างเดียว อาหาร กิจกรรม รถ ไกด์ขยับด้วย",
    ai: "ถาม: “Trip Simulator”, “Disruption Coordinator”, “วันนี้ต้องให้ใครตอบรับ”",
    steps: [
      { n: "1", t: "อ่านไทม์ไลน์เทียบนาฬิกา", b: "ถ้า CZ3051 สาย ดอยสุเทพ 10:30 และอาหาร 12:15 พัง ใช้เวลา 15:30 / 13:30 ที่เสนอ" },
      { n: "2", t: "เปิด incident อย่าซ่อน", b: "open → recovering → closed ต้นทุนกู้ต้องโผล่ที่การเงิน" },
      { n: "3", t: "เก็บใบตอบรับ", b: "ร้าน กิจกรรม รถ ลูกค้า ถ้ายังไม่ติ๊ก แปลว่าเขายังถือเวลาเดิม" },
      { n: "4", t: "ส่งแผนเดียวกันไปพอร์ทัล", b: "ไกด์เห็นสล็อตใหม่ ผู้เดินทางเห็นวันที่แก้ ห้ามมีแผน WhatsApp ชุดที่สอง" },
    ],
  },
  finance: {
    goal: "ดูมาร์จิ้นตามใบเสนอเทียบของจริง เงินเข้าจากลูกค้า เจ้าหนี้ซัพพลายเออร์ และช่องว่างเงินสด",
    watch: "มาร์จิ้นในใบเสนอเป็นประวัติ มาร์จิ้นสดรวมห้องเดินและล่วงเวลา เก็บแล้ว ≠ รับรู้รายได้",
    ai: "ถาม: “Profit Guardian”, “จุดคุ้มทุนกี่คน”, “ถ้าลูกค้าไม่โอนจะขาดเงินเท่าไร”",
    steps: [
      { n: "1", t: "เทียบใบเสนอกับต้นทุนสด", b: "v2 ที่ส่งลูกค้า กับบริการที่ผูกแล้ว ช่องว่างคือของรั่วที่ต้องอธิบาย" },
      { n: "2", t: "ไล่เล็จเจอร์ตามอายุ", b: "มัดจำเข้า ยอดคงเหลือรอ TG จ่ายแล้ว โรงแรม/รถยังไม่ถึงกำหนด" },
      { n: "3", t: "ดูจุดคุ้มทุนก่อนลดราคา", b: "ถ้าลดราคา ให้รันจุดคุ้มทุนใหม่ ห้ามต่ำกว่าโดยไม่อนุมัติ" },
      { n: "4", t: "ปิดทริปเมื่อเงินตรงกับปฏิบัติการ", b: "ปิดแล้วเขียนกำไรจริง เงินเข้าครบ เงินออกจ่ายหรือรับยอดแล้ว" },
    ],
  },
  analytics: {
    goal: "ทบทวนยอดขาย การใช้ที่นั่ง อุบัติการณ์ และ Tour Memory เพื่อให้เทมเพลตอินบาวด์สามเหลี่ยมทองคำครั้งหน้าดีกว่านี้",
    watch: "Memory เป็นคำแนะนำทริปหน้า ไม่ได้แก้ departure นี้เงียบ ๆ",
    ai: "ถาม: “Tour Memory”, “ทำไมดอยสุเทพเช้าพังหลังไฟลต์สายเข้า CNX”",
    steps: [
      { n: "1", t: "อ่านสกอร์การ์ดทริปนี้", b: "งานที่ชนะ มาร์จิ้น ใช้ความจุ อุบัติการณ์ GMV" },
      { n: "2", t: "เอา memory ใส่เทมเพลตหน้า", b: "วันที่ 1: เมืองเก่าก่อนถ้าสาย ดอยสุเทพบ่าย ใส่ล่วงเวลาคนขับในใบเสนอ" },
      { n: "3", t: "ทำเครื่องหมายซัพพลายเออร์ที่ช้า", b: "ร้านตอบช้า → ทริปหน้าบังคับตอบเป็นลายลักษณ์อักษรก่อน 48 ชม." },
      { n: "4", t: "อย่าพยากรณ์จากทริปเดียว", b: "Capacity Exchange และการพยากรณ์ที่นั่งเป็นขั้นถัดไป ยังไม่อยู่หน้านี้" },
    ],
  },
  portals: {
    goal: "ให้ผู้เดินทาง ผู้จัดกรุ๊ป ซัพพลายเออร์ และไกด์ใช้หน้าสั้นบนมือถือ ไม่ใช่ OS เต็ม",
    watch: "ลิงก์ซัพพลายเออร์เห็นแค่บริการเดียว ห้ามแปะเรทเจรจาในมุมมองลูกค้า",
    ai: "ถาม: “ไกด์ควรเห็นอะไรหลังดีเลย์”, “ร่างข้อความถึงลูกค้า”",
    steps: [
      { n: "1", t: "ผู้เดินทาง — โปรแกรมและงานเอกสาร", b: "รายวัน วาวเชอร์ พาสปอร์ตยังขาด มัดจำกับยอดคงเหลือ" },
      { n: "2", t: "ผู้จัดกรุ๊ป — รายชื่อ", b: "ชื่อ ห้อง พาสปอร์ตขาด เขาเพิ่มคนได้ แต่คุณยังต้องอนุมัติของ" },
      { n: "3", t: "ซัพพลายเออร์ — ปุ่มยืนยันเดียว", b: "หัวอาหารและเวลาใหม่เท่านั้น ไม่เห็นทริปอื่น" },
      { n: "4", t: "ไกด์ — แมนิเฟสต์และเหตุ", b: "สล็อตดอยสุเทพใหม่ งานค้าง บันทึกดีเลย์กลับเข้าทริปสด" },
    ],
  },
  scope: {
    goal: "ดูว่า TOUR24 มีอะไรอยู่แล้ว อะไรขยายใน OS นี้ และอะไรยังเป็นขั้นถัดไป",
    watch: "มีอยู่แล้ว ≠ ทำครบ จองในมาร์เก็ตเพลสใช้ได้ API สายการบินยังไม่มี",
    ai: "ถาม: “เฟสแรกมีอะไร”, “Capacity Exchange อยู่ในบิลด์นี้ไหม”",
    steps: [
      { n: "1", t: "อ่านชิปสถานะ", b: "available = มาร์เก็ตเพลสเดิม expand = ต่อเข้า OS แล้ว new = สร้างที่นี่ later = ยังไม่ทำ" },
      { n: "2", t: "ใช้เดโม 40 คนเป็นบททดสอบ", b: "ถ้าเพิ่ม 5 คนแล้วดีเลย์แล้วยังไม่ขยับทุกบริการ แปลว่า OS ยังไม่ต่อกัน" },
      { n: "3", t: "ช่องทางขายเป็นแค่ช่องทาง", b: "เว็บ มาร์เก็ตเพลส Agent Direct ขายของ ไม่ได้มีไฟล์ปฏิบัติการของตัวเอง" },
      { n: "4", t: "เปิด Playbook ของทุกเมนูอื่น", b: "หน้านี้คือแผนที่ Playbook ของแต่ละเมนูคือวิธีทำงาน" },
    ],
  },
  agi: {
    goal: "มอบวัตถุประสงค์ทางธุรกิจให้ทีมเอเจนต์ วางแผน ประสานโมดูล ทำในกรอบอำนาจ แล้วส่งเฉพาะจุดที่ต้องอนุมัติ",
    watch: "โหมด AGI เป็นชั้นแยกจาก AI ปกติ โปรแกรมที่สวยยังไม่ใช่การจอง ปิดสวิตช์เพื่อกลับไปถามทีละงาน",
    ai: "มอบบรีฟอินบาวด์สามเหลี่ยมทองคำ 40 คน แล้ว Change Once เป็น 32 แล้วกู้ทริปเมื่อไฟลต์ดีเลย์",
    steps: [
      { n: "1", t: "เปิดโหมด AGI", b: "แท่นถาม AI สีทองด้านบนพื้นที่ทำงานกลายเป็นกล่องวัตถุประสงค์ เพลย์บุ๊กปิดอยู่จนกว่าจะเปิด" },
      { n: "2", t: "สั่งคำสั่งเดียว", b: "ทีมเขียนโปรเจกต์ลงขาย สร้างทัวร์ ไฟลต์ ซัพพลายเออร์ การเงิน — ทุกบรรทัดยังเป็น requested / ประมาณการ" },
      { n: "3", t: "เปลี่ยนครั้งเดียว", b: "32 คนรื้อไฟลต์ ห้อง รถ อาหาร มาร์จิ้น อนุมัติเมื่ออ่านแล้วว่าใครต้องคอนเฟิร์มใหม่" },
      { n: "4", t: "กู้ทริปหรือรับงานเอง", b: "ดีเลย์เปิดแผนกู้ ของถูกทำได้ในวงเงิน พักหรือรับงานเองได้เสมอ" },
    ],
  },
};

const zh: Record<MenuKey, MenuPlaybook> = {
  home: {
    goal: "在一页看清今日发团、逾期任务、未确认供应商和毛利，并继续 40 人金三角入境验收演示。",
    watch: "黄色条目尚未预订。不要把加班或散客房价当成已确认成本。",
    ai: "问系统：“看毛利”“哪些逾期”“跑演示”。",
    steps: [
      { n: "1", t: "先读四格影响条", b: "发生了什么、为何重要、钱、下一步。有待批包装时在这里批准。" },
      { n: "2", t: "先清紧急截止", b: "名单、酒店释放、缺护照、应收余款。曼谷时间 ≠ 中国时间。" },
      { n: "3", t: "打开当日发团", b: "点进金三角入境团，在同一档案处理客人、机票和供应商。" },
      { n: "4", t: "按顺序用演示按钮", b: "加 5 人 → 延误 CZ3051 → 批准 → 关团。只有要干净档案时才重置。" },
    ],
  },
  sales: {
    goal: "把网站、团队询价、市场或 Agent Direct 的询盘做成简报、报价版本并赢单成团。",
    watch: "简报不是预订。渠道费只在占位之后才计。",
    ai: "问：“做简报”“对比报价版本”“毛利为何变了”。",
    steps: [
      { n: "1", t: "收全询盘", b: "渠道、人数、预算、目的地、跟进人齐了再让 AI 起草产品。" },
      { n: "2", t: "改 AI 简报并写入记录", b: "改人数、购物规则、酒店等级、售价。不要留在命令条里。" },
      { n: "3", t: "报价必须分版本", b: "v1 成本稿，v2 给客户。已发出的版本不可覆盖。" },
      { n: "4", t: "赢单后挂出发团", b: "赢单后库存归发团工作台，销售不再单独占资源。" },
    ],
  },
  builder: {
    goal: "做可复用线路：日程、供应商、按人计价、附加费，以及对照目标的实时毛利。",
    watch: "未确认服务保持黄色。儿童 75%、单房差、16 免 1 在合同写明前只是假设。",
    ai: "问：“Tour Producer”“拆成本”“还有什么未确认”。",
    steps: [
      { n: "1", t: "锁产品，不锁日期", b: "模板编号、最低成团、容量、毛利目标属于产品。日期属于发团。" },
      { n: "2", t: "把服务放到具体日", b: "机票、酒店、餐、景点必须落在某一天，变更影响才能移动它们。" },
      { n: "3", t: "边改边看实时成本", b: "毛利低于目标就改费率或售价，不要藏缺口。" },
      { n: "4", t: "把假设写进框里", b: "具名酒店、无购物、免房规则，随每个报价版本走。" },
    ],
  },
  departure: {
    goal: "在一个日期档案上操作：客人、机票、车、房、餐、活动、导游、证件、财务，同一套编号。",
    watch: "人数、航班时刻或行程一变，必须先走变更影响，再动库存。",
    ai: "问：“加 5 人”“谁证件未齐”“抵达延误会砸什么”。",
    steps: [
      { n: "1", t: "用标签页，不要拆档案", b: "总览是服务清单。客人、机票、客房、财务是同一发团。" },
      { n: "2", t: "交航空名单前先做就绪检查", b: "缺护照、姓名不一致、无保险必须处理或接受风险。" },
      { n: "3", t: "看价格等级", b: "参考 → 报价 → 占位 → 确认。占位有到期。只有确认才可执行。" },
      { n: "4", t: "先批影响，再让供应商确认", b: "加人 or 延误会生成审批包。未批准前不要确认房和餐。" },
    ],
  },
  flights: {
    goal: "管团队座位：已售/未售、PNR、订金、释放/交名单/出票截止，以及留座还是放回。",
    watch: "未售座位按单位成本计敞口。过了交名单日再放，仍可能罚金。",
    ai: "问：“留还是放未售座位”“名单是否就绪”“散客价还是consolidator”。",
    steps: [
      { n: "1", t: "先读整行座位块", b: "航司、航线、座位数、已售、PNR、交名单、出票、敞口、时区。" },
      { n: "2", t: "姓名必须对护照", b: "listed 不是已出票。护照姓名不一致会提交失败。" },
      { n: "3", t: "遵守 consolidator 条款", b: "典型：订金 30%，T-21 释放，T-14 交名单。儿童票和改名费必须写明。" },
      { n: "4", t: "按整团成本决定留/放", b: "企业团还在加人就不要放块。5 张散客票是变更影响，不是偷偷改数。" },
    ],
  },
  suppliers: {
    goal: "保存合同与价卡，比较同类报价，发预留，收确认，留下服务历史。",
    watch: "抽取的价格可能错。先改字段再确认。供应商链接只显示这一项服务。",
    ai: "问：“Supplier Buyer”“这份报价缺什么”“谁还没回执”。",
    steps: [
      { n: "1", t: "只比较同等报价", b: "同日期、同包含。缺儿童价、加班、停车、改名费要标出来。" },
      { n: "2", t: "价格等级必须诚实", b: "PDF 抽取=参考，邮件报价=已报价，已付订金=占位。" },
      { n: "3", t: "发短确认链接", b: "餐厅和车队从 /portal/supplier 回执，不必登录整套 OS。" },
      { n: "4", t: "对方回复后再点回执", b: "Acknowledge 之后，状态才走向确认。" },
    ],
  },
  live: {
    goal: "现场执行：时间轴、服务就绪、事件、恢复方案，以及谁已确认新计划。",
    watch: "抵达延误不只是航班问题——餐、景点、车、导游都要动。",
    ai: "问：“Trip Simulator”“Disruption Coordinator”“今天必须谁回执”。",
    steps: [
      { n: "1", t: "对照时钟读时间轴", b: "CZ3051 晚到，10:30 双龙寺和 12:15 午餐会失败。用建议的 15:30 / 13:30。" },
      { n: "2", t: "打开事件，不要藏", b: "open → recovering → closed。恢复成本必须出现在财务。" },
      { n: "3", t: "收集回执", b: "餐厅、景点、车、客户。未勾选等于对方还拿着旧时间。" },
      { n: "4", t: "同一套计划推到门户", b: "导游手机看新场次，客人看改后日程。不要另发一套 WhatsApp 计划。" },
    ],
  },
  finance: {
    goal: "看报价毛利对实际、客户回款、应付供应商和现金缺口。",
    watch: "报价毛利是历史。实时毛利含散客房和加班。已收款 ≠ 已确认收入。",
    ai: "问：“Profit Guardian”“盈亏平衡人数”“余款不到会缺多少现金”。",
    steps: [
      { n: "1", t: "对比报价与实时成本", b: "给客户的 v2 对已承诺服务。差额就是必须解释的泄漏。" },
      { n: "2", t: "按账龄看台账", b: "订金已收、余款待收、航司订金已付、酒店/车仍应付。" },
      { n: "3", t: "降价前先算盈亏平衡", b: "打折必须重算盈亏平衡人数。未经批准不得低于该线。" },
      { n: "4", t: "钱与操作对齐再关团", b: "关团写入实际利润。应收已收，应付已付或已接受。" },
    ],
  },
  analytics: {
    goal: "复盘销售、利用率、事件和 Tour Memory，让下一版金三角入境模板更好。",
    watch: "Memory 是给下一产品的建议，不会悄悄改掉本团。",
    ai: "问：“Tour Memory”“晚到清迈后为何上午双龙寺容易失败”。",
    steps: [
      { n: "1", t: "读本团记分卡", b: "赢单、毛利、容量利用率、事件数、GMV。" },
      { n: "2", t: "把记忆写进下一模板", b: "第 1 天：若晚到先古城，下午双龙寺。报价计入司机加班。" },
      { n: "3", t: "标记迟缓供应商", b: "餐厅回执慢 → 下团要求出发前 48 小时书面确认。" },
      { n: "4", t: "不要用一趟团做预测", b: "运力互换和座位预测是后期能力，本屏尚未提供。" },
    ],
  },
  portals: {
    goal: "给客人、组团人、供应商、导游用短移动页，而不是整套操作后台。",
    watch: "供应商链接只对一项服务。谈判价不得出现在客人视图。",
    ai: "问：“延误后导游应看到什么”“起草客户通知”。",
    steps: [
      { n: "1", t: "客人 — 行程与材料", b: "日程、凭证、缺护照、订金与余款。" },
      { n: "2", t: "组团人 — 名单", b: "姓名、房间、缺护照。他们可加人，库存仍须你批准。" },
      { n: "3", t: "供应商 — 一个确认键", b: "只看人数和新用餐时间，看不到其他团。" },
      { n: "4", t: "导游 — 名单与事件", b: "新的双龙寺场次、待办、把延误记回现场指挥。" },
    ],
  },
  scope: {
    goal: "看清 TOUR24 原有能力、本次 OS 扩展，以及仍属后期的部分。",
    watch: "已有 ≠ 做完。市场预订已上线，航司 API 还没有。",
    ai: "问：“首发范围是什么”“本构建有没有 Capacity Exchange”。",
    steps: [
      { n: "1", t: "读状态标签", b: "available=原市场，expand=已接入 OS，new=这里新建，later=本版没有。" },
      { n: "2", t: "用 40 人情景当验收", b: "加人再延误若带不动所有服务，说明 OS 还没连上。" },
      { n: "3", t: "渠道只是渠道", b: "网站、市场、Agent Direct 负责卖，不各自另做操作档案。" },
      { n: "4", t: "去其他菜单打开 Playbook", b: "本页是地图。各菜单 Playbook 才是作业程序。" },
    ],
  },
  agi: {
    goal: "把业务目标交给智能体团队。他们规划、协调模块、在权限内执行，并把需要批准的决定送来。",
    watch: "AGI 模式与普通 AI 分层。漂亮行程不是预订。关掉开关就回到单任务帮助。",
    ai: "下达金三角入境 40 人简报，再把人数改成 32，再用行程救援处理延误。",
    steps: [
      { n: "1", t: "打开 AGI 模式", b: "金色层把“问系统”换成目标框。关掉后普通 AI 仍在。" },
      { n: "2", t: "一条指令", b: "团队把项目写入销售、搭建、机票、供应商、财务——所有行仍是 requested / 估算。" },
      { n: "3", t: "改一次", b: "32 人重算机票、客房、车、餐、毛利。先看谁必须重新确认再批准。" },
      { n: "4", t: "救援或接管", b: "延误打开恢复方案。低成本动作可在额度内执行。随时暂停或接管。" },
    ],
  },
};

const ru: Record<MenuKey, MenuPlaybook> = {
  home: {
    goal: "Видеть сегодняшние заезды, просрочки, неподтверждённых поставщиков и маржу — и вести inbound-демо Золотой треугольник на 40 человек.",
    watch: "Жёлтое ещё не забронировано. Не считайте сверхурочные и walk-up номера подтверждённой себестоимостью.",
    ai: "Спросите: «покажи маржу», «что просрочено», «запусти демо».",
    steps: [
      { n: "1", t: "Сначала четыре блока влияния", b: "Что случилось, почему важно, деньги, следующий шаг. Одобряйте пакет здесь." },
      { n: "2", t: "Сначала срочные дедлайны", b: "Имена в авиакомпанию, релиз отеля, паспорта, баланс клиента. ICT ≠ CST Китая." },
      { n: "3", t: "Откройте живой заезд", b: "Клик по inbound-группе Золотой треугольник — пассажиры, рейсы и поставщики в одном файле." },
      { n: "4", t: "Кнопки демо по порядку", b: "Добавить 5 → задержать CZ3051 → утвердить → закрыть. Сброс только для чистого файла." },
    ],
  },
  sales: {
    goal: "Превратить заявку с сайта, группы, маркетплейса или Agent Direct в бриф, версии сметы и выигранный заезд.",
    watch: "Бриф — не бронь. Комиссия канала считается только после аллокации мест.",
    ai: "Спросите: «сделай бриф», «сравни версии сметы», «почему изменилась маржа».",
    steps: [
      { n: "1", t: "Соберите заявку полностью", b: "Канал, число людей, бюджет, направление, владелец follow-up — до черновика ИИ." },
      { n: "2", t: "Правите бриф и пишите в записи", b: "Люди, шопинг, класс отеля, цена. Не оставляйте черновик в командной строке." },
      { n: "3", t: "Сметы только версиями", b: "v1 — себестоимость, v2 — клиенту. Отправленную версию не перезаписывать." },
      { n: "4", t: "Выигрыш привязывает заезд", b: "После выигрыша инвентарь живёт в departure, не в продажах." },
    ],
  },
  builder: {
    goal: "Собрать шаблон тура: дни, поставщики, цена на человека, доплаты и живая маржа к цели.",
    watch: "Неподтверждённые услуги — жёлтые. Детский 75%, одноместная и FOC 1/16 — допущения, пока нет договора.",
    ai: "Спросите: «Tour Producer», «разложи себестоимость», «что ещё не подтверждено».",
    steps: [
      { n: "1", t: "Фиксируйте продукт, не дату", b: "Код шаблона, min pax, ёмкость, цель маржи — у продукта. Даты — у заезда." },
      { n: "2", t: "Сажайте услуги на дни", b: "Рейсы, отели, еда, экскурсии должны быть на дне, иначе Change Impact их не сдвинет." },
      { n: "3", t: "Смотрите калькуляцию сразу", b: "Маржа ниже цели — меняйте тариф или продажу, не прячьте разрыв." },
      { n: "4", t: "Пишите допущения в поле", b: "Именные отели, без магазинов, FOC. Они едут с каждой версией сметы." },
    ],
  },
  departure: {
    goal: "Вести один датированный файл: пассажиры, рейсы, автобусы, номера, питание, активности, гиды, документы, финансы.",
    watch: "Смена числа людей, времени рейса или программы — только через Change Impact.",
    ai: "Спросите: «добавь 5 пассажиров», «кто не готов по документам», «что сломает задержка прилёта».",
    steps: [
      { n: "1", t: "Вкладки, не отдельные файлы", b: "Обзор — список услуг. Pax, рейсы, номера и финансы — тот же заезд." },
      { n: "2", t: "Готовность до сдачи имён в авиакомпанию", b: "Нет паспорта, несовпадение имени, нет страховки — закрыть или принять риск." },
      { n: "3", t: "Смотрите класс ставки", b: "Indicative → quoted → held → confirmed. Hold истекает. Для операций нужна confirmed." },
      { n: "4", t: "Сначала approval, потом подтверждение поставщика", b: "Добавка людей или задержка создаёт пакет. Не подтверждайте отель/обед до approval." },
    ],
  },
  flights: {
    goal: "Блоки мест: sold/unsold, PNR, депозит, дедлайны release / имена / билеты, держать или отдавать пустые места.",
    watch: "Пустые места — денежная экспозиция по себестоимости. Release после name-list всё ещё может штрафоваться.",
    ai: "Спросите: «держать или отдать места», «готовность name-list», «walk-up или консолидатор».",
    steps: [
      { n: "1", t: "Сначала строка блока", b: "Авиакомпания, маршрут, места, sold, PNR, имена, билеты, экспозиция, часовой пояс." },
      { n: "2", t: "Имена = паспорт", b: "listed ≠ ticketed. Расхождение с паспортом валит сдачу списка." },
      { n: "3", t: "Условия консолидатора", b: "Обычно депозит 30%, release T-21, имена T-14. Детский тариф и смена имени — письменно." },
      { n: "4", t: "Keep/release от полной себестоимости тура", b: "Не отдавайте корпоративный блок, пока клиент ещё добавляет людей. 5 walk-up — Change Impact." },
    ],
  },
  suppliers: {
    goal: "Договоры и рейткарты, сравнение офферов, заявки, подтверждения, история сервиса.",
    watch: "Извлечённый тариф может быть неверен. Исправьте поле, затем confirm. Ссылка поставщика — только эта услуга.",
    ai: "Спросите: «Supplier Buyer», «чего не хватает в оффере», «кто не подтвердил».",
    steps: [
      { n: "1", t: "Сравнивайте сопоставимое", b: "Те же даты и включения. Пометьте детский тариф, OT, парковку, смену имени." },
      { n: "2", t: "Честный класс ставки", b: "PDF = indicative, письмо = quoted, депозит = held." },
      { n: "3", t: "Короткая ссылка на подтверждение", b: "Ресторан и автобус жмут ack на /portal/supplier без полного входа в OS." },
      { n: "4", t: "Acknowledge только после ответа", b: "После ответа поставщика статус идёт к confirmed." },
    ],
  },
  live: {
    goal: "Живой тур: таймлайн, готовность, инциденты, recovery и кто подтвердил новый план.",
    watch: "Задержка прилёта двигает еду, объекты, автобусы и гидов, не только рейс.",
    ai: "Спросите: «Trip Simulator», «Disruption Coordinator», «чьи ack нужны сегодня».",
    steps: [
      { n: "1", t: "Таймлайн против часов", b: "Поздний CZ3051 срывает Doi Suthep 10:30 и обед 12:15. Берите 15:30 / 13:30." },
      { n: "2", t: "Инцидент открытым", b: "open → recovering → closed. Стоимость recovery должна быть в финансах." },
      { n: "3", t: "Соберите ack", b: "Ресторан, объект, автобусы, клиент. Нет галочки — у них старое время." },
      { n: "4", t: "Один план в порталы", b: "Гид видит новый слот, турист — новый день. Без второго плана в WhatsApp." },
    ],
  },
  finance: {
    goal: "Ожидаемая и фактическая маржа, сборы с клиента, payables поставщикам, кассовый разрыв.",
    watch: "Маржа в смете — история. Живая маржа включает walk-up и сверхурочные. Collected ≠ выручка.",
    ai: "Спросите: «Profit Guardian», «точка безубыточности», «кассовый разрыв, если не придёт баланс».",
    steps: [
      { n: "1", t: "Смета против живой себестоимости", b: "v2 клиенту vs связанные услуги. Разрыв — утечка, которую надо объяснить." },
      { n: "2", t: "Возраст строк ledger", b: "Депозит получен, баланс ждут, депозит TG оплачен, отель/автобус ещё к оплате." },
      { n: "3", t: "Безубыточность до скидки", b: "Скидка — пересчёт break-even. Ниже линии только с approval." },
      { n: "4", t: "Закрытие, когда деньги = операции", b: "Закрытие пишет фактическую прибыль. Входы получены, выходы оплачены или приняты." },
    ],
  },
  analytics: {
    goal: "Продажи, загрузка, инциденты и Tour Memory — чтобы следующий inbound-шаблон Золотой треугольник был лучше.",
    watch: "Memory советует следующий продукт, не меняет этот заезд молча.",
    ai: "Спросите: «Tour Memory», «почему утренний Doi Suthep падает после позднего прилёта в CNX».",
    steps: [
      { n: "1", t: "Карточка этого заезда", b: "Выигранная заявка, маржа, загрузка, инциденты, GMV." },
      { n: "2", t: "Память — в следующий шаблон", b: "День 1: если опоздание — сначала старый город, Doi Suthep днём. Сверхурочные водителя — в смету." },
      { n: "3", t: "Метьте медленных поставщиков", b: "Поздний ack ресторана → в следующий раз письменный ack за 48 ч." },
      { n: "4", t: "Не прогнозируйте по одному туру", b: "Capacity Exchange и прогноз мест — следующий этап, не этот экран." },
    ],
  },
  portals: {
    goal: "Короткие мобильные страницы для туриста, организатора, поставщика и гида — не весь OS.",
    watch: "Ссылка поставщика — одна услуга. Договорные тарифы не должны попасть туристу.",
    ai: "Спросите: «что должен видеть гид после задержки», «черновик письма клиенту».",
    steps: [
      { n: "1", t: "Турист — программа и задачи", b: "Дни, ваучер, нужен паспорт, депозит и баланс." },
      { n: "2", t: "Организатор — список группы", b: "Имена, комнаты, паспорта. Они добавляют людей, инвентарь утверждаете вы." },
      { n: "3", t: "Поставщик — одна кнопка", b: "Только headcount и новое время еды. Других заездов нет." },
      { n: "4", t: "Гид — манифест и инцидент", b: "Новый слот Doi Suthep, задачи, заметка о задержке обратно в Live trip." },
    ],
  },
  scope: {
    goal: "Что уже было в TOUR24, что расширили в OS, что ещё later-stage.",
    watch: "Available ≠ готово. Бронь на маркетплейсе живая; API авиакомпаний нет.",
    ai: "Спросите: «что в первом релизе», «есть ли Capacity Exchange в этой сборке».",
    steps: [
      { n: "1", t: "Читайте чип статуса", b: "available = маркетплейс, expand = подключено к OS, new = сделано здесь, later = не в этом релизе." },
      { n: "2", t: "Тест — сценарий на 40 человек", b: "Если +5 и задержка не двигают все услуги, OS не связан." },
      { n: "3", t: "Каналы остаются каналами", b: "Сайт, маркетплейс, Agent Direct продают. У них нет своего ops-файла." },
      { n: "4", t: "Playbook на каждом другом меню", b: "Эта страница — карта. Playbook меню — рабочая процедура." },
    ],
  },
  agi: {
    goal: "Поставьте бизнес-цель агентной команде. Они планируют, координируют модули, действуют в рамках полномочий и приносят согласования.",
    watch: "Режим AGI — отдельный слой от обычного ИИ. Красивая программа — не бронь. Выключите тумблер, чтобы вернуться к одной задаче.",
    ai: "Поставьте бриф inbound Золотой треугольник на 40 человек, затем Change Once на 32, затем Trip Rescue при задержке.",
    steps: [
      { n: "1", t: "Включите AGI", b: "Золотой слой меняет «Спросить ОС» на поле цели. Обычный ИИ остаётся при выключении." },
      { n: "2", t: "Одна команда", b: "Команда пишет проект в продажи, конструктор, рейсы, поставщиков и финансы — все строки requested / оценка." },
      { n: "3", t: "Одно изменение", b: "32 человека пересчитывают авиа, номера, автобус, питание и маржу. Утверждайте после списка reconfirm." },
      { n: "4", t: "Спасение или перехват", b: "Задержка открывает recovery. Дешёвые шаги — в лимите. Пауза или take over в любой момент." },
    ],
  },
};

const BOOKS: Record<Lang, Record<MenuKey, MenuPlaybook>> = { en, th, zh, ru };

export function menuPlaybook(lang: Lang, key: MenuKey): MenuPlaybook {
  return BOOKS[lang]?.[key] || BOOKS.en[key];
}

export const MENU_KEYS: MenuKey[] = [
  "home",
  "sales",
  "builder",
  "departure",
  "flights",
  "suppliers",
  "live",
  "finance",
  "analytics",
  "portals",
  "scope",
  "agi",
];

export const PLAYBOOK_CODE: Record<MenuKey, string> = {
  home: "PB-01",
  sales: "PB-02",
  builder: "PB-03",
  departure: "PB-04",
  flights: "PB-05",
  suppliers: "PB-06",
  live: "PB-07",
  finance: "PB-08",
  analytics: "PB-09",
  portals: "PB-10",
  scope: "PB-11",
  agi: "PB-12",
};

export function menuKeyFromPath(path: string): MenuKey {
  if (path.startsWith("/os/agi")) return "agi";
  if (path.startsWith("/os/sales")) return "sales";
  if (path.startsWith("/os/builder")) return "builder";
  if (path.startsWith("/os/departures")) return "departure";
  if (path.startsWith("/os/flights")) return "flights";
  if (path.startsWith("/os/suppliers")) return "suppliers";
  if (path.startsWith("/os/live")) return "live";
  if (path.startsWith("/os/finance")) return "finance";
  if (path.startsWith("/os/analytics")) return "analytics";
  if (path.startsWith("/os/portals")) return "portals";
  if (path.startsWith("/os/scope")) return "scope";
  return "home";
}
