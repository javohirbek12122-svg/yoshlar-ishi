# Xavfsizlik holati va bo‘shliqlar reyestri

**Audit sanasi:** 14-noyabr 2026  
**Audit turi:** kod, arxitektura va Supabase Advisor bo‘yicha dastlabki desk audit. Mustaqil pentest yoki rasmiy kiberxavfsizlik ekspertizasi emas.

## 1. Mavjud nazoratlar

| Nazorat | Dalil | Holat |
|---|---|---|
| Frontend’da faqat publishable/anon key | config.js; service-role kalit yo‘q | Mavjud |
| Server-side write path | community-submit Edge Function | Mavjud |
| RLS va owner-scoped access | SQL migrations va account RPC’lar | Mavjud |
| Admin allowlist | admin_allowlist va admin RPC’lar | Mavjud |
| Rate limiting | Edge Function quota va server-side hash | Mavjud |
| Input limits/honeypot | Edge Function validation | Mavjud |
| CI va mobil regressiya | GitHub Actions; 63 viewport combination va contrast tests | Mavjud |
| Audit trail | DB audit sxemasi | Mavjud; mustaqil tamper-resistance sinovi yo‘q |
| Secret management | Supabase Edge Function Secrets | Konfiguratsiya mexanizmi bor; rotatsiya dalili kerak |
| Rasmiy API/SSO | OneID/idoralararo integratsiya yo‘q | Ataylab yoqilmagan |

## 2. Supabase Advisor natijalari (14.11.2026)

### Security
- 4 ta SECURITY DEFINER admin RPC funksiyasi authenticated rolidan chaqirilishi mumkinligi haqida ogohlantirish.
- Kod tekshiruvida to‘rt funksiya auth.uid() mavjudligini va faol admin_allowlist yozuvini tekshiradi; search_path bo‘sh qilib belgilangan. Bu ataylab qo‘yilgan admin modeli, ammo tashqi auditor endpoint, JWT email claim, allowlist boshqaruvi va privilege escalation ssenariylarini sinashi shart.
- Supabase Auth’da leaked-password protection o‘chirilgan. Keng pilotdan oldin yoqish va login siyosatini sinash kerak.

### Performance
- 1 ta RLS policy’da auth chaqiruvi row darajasida qayta hisoblanadi.
- 7 ta jadvalda bir xil rol/amal uchun bir nechta permissive policy.
- 21 ta foydalanilmagan indeks haqida informatsion ogohlantirish.
- Bular tasdiqlangan xavfsizlik buzilishi emas; real query workload va scale bo‘yicha ko‘rib chiqiladi.

### Health
- Advisor health kategoriyasida lint topilmadi. Bu to‘liq kiberxavfsizlik tekshiruvi emas.

## 3. P0 — davlat ma’lumoti yoki rasmiy integratsiyadan oldin

| Vazifa | Nega kerak | Qabul dalili |
|---|---|---|
| Data operator/mulkdor va mas’ulni tayinlash | Qonuniy javobgarlik | Idora qarori/shartnoma va data registry |
| Cross-border transfer xulosasi | DB region ap-south-1 | Yurist xulosasi yoki tasdiqlangan lokal hosting |
| Hosting/tarmoq arxitekturasi | Hozirgi Vercel/Supabase davlat muhiti sifatida tasdiqlanmagan | Operator yozma kelishuvi |
| Mustaqil VAPT/pentest | CI pentest o‘rnini bosmaydi | Mustaqil hisobot; kritik/yuqori topilmalar yopilgan |
| Admin MFA/password hygiene | Admin konturi yuqori xavfli | MFA, breached-password himoyasi, access review |
| Secret inventory/rotatsiya | Uchinchi tomon kalitlari | Secret reyestri, rotatsiya va revoke testi |
| Audit log siyosati | Hodisa tekshiruvi | Himoyalangan markaziy audit log va retention |
| Backup/DR | Uzluksizlik | Restore sinovi, tasdiqlangan RTO/RPO |
| Incident response | Data breach/service compromise | Kontaktlar, severity, xabar berish oqimi, mashq |
| AI va tashqi provayderlar | Groq/Telegram | Pilotda o‘chirilgan yoki yozma ruxsat va shartnoma bilan tasdiqlangan |

## 4. P1 — productiondan oldin

- SAST, DAST, dependency scanning, secret scanning va SBOM.
- PR review, release approval, imzolangan build artefaktlari va rollback.
- WAF, DDoS, rate-limit va abuse monitoring.
- Vulnerability management va patch SLA.
- TLS/HSTS, secure session/cookie, CSRF/XSS/CSP siyosati.
- Backup encryption va key-management hujjatlari.
- SIEM/alerting, audit log integrity va vaqt sinxronizatsiyasi.
- Load/concurrency va API failure testlari.
- Accessibility bo‘yicha qo‘lda keyboard, screen-reader va real foydalanuvchi sinovi.
- Support va xizmat uzluksizligi uchun shartnomaviy SLA.

## 5. Mustaqil sinov ssenariylari

1. Allowlist bo‘lmagan authenticated foydalanuvchi admin RPC’dan ma’lumot ololmasligi.
2. O‘chirilgan admin hisob sessiyasi bilan ruxsatsiz amal bajarolmasligi.
3. Bir foydalanuvchi boshqa foydalanuvchi journey/initiative yozuvini o‘qiy olmasligi.
4. Public form orqali status, admin_notes yoki internal field o‘zgartirib bo‘lmasligi.
5. XSS, SQL injection, IDOR/BOLA, CSRF, SSRF va auth bypass.
6. Rate limit aylanib o‘tish, spam va service exhaustion.
7. LLM prompt injection va maxfiy matnni tashqi provayderga chiqarish.
8. Backup restore, incident paytida integratsiyani uzish va audit izini saqlash.

**Hozirgi baho:** funksional prototip va no-production demonstratsiya uchun yetarli; davlat ma’lumotlari bilan production uchun tayyor emas.
