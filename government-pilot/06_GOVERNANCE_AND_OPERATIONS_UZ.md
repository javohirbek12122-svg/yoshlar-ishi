# Boshqaruv, operatsion model va javobgarlik

## 1. Tavsiya etilgan boshqaruv

| Rol | Mas’uliyat | Kim tayinlaydi |
|---|---|---|
| Biznes-egasi / buyurtmachi | Pilot maqsadi, xizmatlar doirasi va KPI | Hamkor davlat idorasi |
| Kontent egasi | Xizmat tavsifi, talab, muddat, to‘lov va rasmiy manba | Xizmat egasi idora |
| Texnik operator | Hosting, integratsiya, uptime va platforma | Vakolatli operator/kelishilgan tomon |
| Axborot xavfsizligi mas’uli | Risk, pentest, access review, incident | Hamkor idora/operator |
| Shaxsga doir ma’lumotlar mas’uli | Qonuniy asos, data map, retention va so‘rovlar | Data controller/operator |
| Mahsulot jamoasi | UI, navigator, katalog, foydalanuvchi tajribasi | Yoshlar-Ishi jamoasi |
| Mustaqil baholovchi | UAT, accessibility, security va KPI validatsiyasi | Tomonlar kelishadi |

## 2. Kontentni boshqarish

Har bir xizmat kartasida:
- nom, maqsad va kimga mosligi;
- xizmat egasi va mas’ul bo‘linma;
- rasmiy manba va ariza havolasi;
- hujjat, muddat va to‘lov bo‘yicha rasmiy havola;
- kontentni tasdiqlagan shaxs;
- oxirgi va keyingi tekshiruv sanasi;
- xatoni yuborish kanali.

Rasmiy manba tekshirilmasdan muddat, subsidiya miqdori yoki eligibility sharti o‘zgartirilmaydi. Har o‘zgarish audit iziga ega bo‘ladi.

## 3. Minimal operatsion siyosatlar

### Access
- individual account va admin MFA;
- rolga asoslangan eng kam vakolat;
- xodim o‘zgarganda access revoke;
- davriy access review;
- favqulodda kirish (break-glass) alohida loglanadi.

### Change/release
- pull request va review;
- dev/test/staging/prod ajratish;
- production release approval;
- rollback va release notes;
- DB migration oldidan backup va change approval.

### Backup/continuity
- backup chastotasi, retention va shifrlash kelishiladi;
- restore sinovi o‘tkaziladi;
- RTO/RPO buyurtmachi tomonidan tasdiqlanadi;
- geozaxiralash tasdiqlangan operator arxitekturasida.

### Monitoring/incident
- uptime, error rate, queue va DB alert;
- admin/security alertlar;
- incident severity, eskalatsiya va dalil saqlash;
- tegishli organga xabar berish tartibi;
- foydalanuvchiga status xabari.

### Data retention
- har bir data category uchun muddat;
- deletion job va dalili;
- legal hold uchun alohida protsedura;
- foydalanuvchi so‘roviga mas’ul va muddat;
- test va production ma’lumotlarini aralashtirmaslik.

## 4. SLA loyihasi

SLA qiymatlari hozir belgilanmaydi: target hosting, tarmoq, monitoring va texnik navbatchilik operator tomonidan tanlanmagan. Shartnomaga kiritishdan oldin uptime, ish vaqti/24×7, P1/P2/P3 javob muddati, rejalashtirilgan texnik ishlar, RTO/RPO, support kanali, provider/subprocessor va xizmatdan chiqish tartibi kelishiladi.

## 5. Xarid va hamkorlik yo‘li

1. Dastlabki uchrashuv va scope tasdiqlash.
2. No-production pilot uchun memorandum yoki boshqa qonuniy hamkorlik shaklini yuridik xizmat bilan tanlash.
3. To‘lovli xizmat xarid qilinsa, buyurtmachi O‘RQ-684 bo‘yicha xarid turini belgilaydi.
4. Texnik topshiriq, SLA, xavfsizlik va data-protection ilovalari shartnomaga kiritiladi.
5. Qabul qilish dalolatnomasi KPI va test dalillariga tayanadi.

## 6. Qaror va o‘zgarishlar reyestri

Har muhim qaror uchun raqam/sana, qaror egasi, sabab/risk, ta’sirlangan modul va data, test natijasi, rollback rejasi hamda rasmiy tasdiq havolasi qayd etiladi.
