# Yoshlar-Ishi — yagona dizayn tizimi

**Versiya:** 1.1 · **Sana:** 14-noyabr 2026

## Mahsulot pozitsiyasi

Yoshlar-Ishi davlat organi emas; yoshlar uchun mustaqil xizmat va imkoniyat navigatori. Interfeys rasmiy, sokin, ishonchli va vazifaga yo‘naltirilgan. Boshqa mamlakatlarning gerbi, logotipi yoki davlat brendi ko‘chirilmaydi.

## Vizual tokenlar

| Token | Qiymat | Vazifasi |
|---|---|---|
| Navy | #123255 | Navigatsiya va asosiy sarlavha |
| Blue | #15558A | Havola va asosiy tugma |
| Blue soft | #EAF3FB | Ikkinchi darajali sirt |
| Ink | #152336 | Asosiy matn |
| Muted | #53677B | Yordamchi matn; och fonlarda kamida 4.5:1 |
| Paper | #F5F8FB | Sahifa foni |
| Surface | #FFFFFF | Karta va forma |
| Green | #176B51 | Ijobiy holat |
| Amber | #8A5814 | Ogohlantirish matni; amber fonida kamida 4.5:1 |
| Red | #A13D3D | Xato va xavf |

## Tipografiya va ritm

- Sarlavha: Manrope 600–800; matn: DM Sans yoki system sans.
- Body: 15–16px, line-height 1.6–1.7.
- Yordamchi izoh: odatda 12–13px.
- Form input: 16px, min-height 48px.
- Tugma va interaktiv targetlar: min-height 44px; asosiy tugma odatda 46px.
- Kontent max-width taxminan 1200px; uzun matn haddan tashqari cho‘zilmaydi.
- Karta 10–12px radius, yengil border va cheklangan shadow.

## Komponentlar

1. Header — oq fon, bir xil balandlik, faol sahifa holati va mobil menyu.
2. Hero — aniq sarlavha, qisqa izoh, bitta asosiy va bitta muqobil CTA.
3. Service card — nom, auditoriya, idora egasi, maqsad, keyingi qadam va manba.
4. Journey stepper — raqam, holat, bajariladigan amal va keyingi qadam.
5. Search/filter — ko‘rinadigan label, sodda filter, natija soni va bo‘sh holat.
6. Form — label, yordamchi matn, xatoni izohlash va yuborishdan oldingi tekshiruv.
7. Status notice — rang bilan birga matn va ikonka; success, warning va error farqlanadi.
8. Footer — mustaqillik, aloqa, maxfiylik, shartlar va rasmiy manbalar.

## Responsive va accessibility

- 320–430px: bitta ustun, katta targetlar, matn kesilmaydi.
- 431–900px: 1–2 ustun, asosiy amal birinchi ekranga yaqin.
- 901px dan yuqori: 2–3 ustun; matn haddan tashqari cho‘zilmaydi.
- Gorizontal overflow yashirilmaydi; layout sababi tuzatiladi.
- prefers-reduced-motion animatsiyalarni kamaytiradi.
- Klaviatura fokusi ko‘rinadi; kontrast faqat rangga tayanmaydi.
- Formalar semantik label va aniq, tuzatiladigan xato xabariga ega.
- Oddiy matn uchun WCAG AA 4.5:1 kontrast, muhim grafik/fokus indikatorlari uchun kamida 3:1 tekshiriladi.
- `npm run check:contrast` palitra, placeholder, yordamchi izoh, warning matni va fokus indikatorlarini avtomatik hisoblaydi.
- 44px target loyiha qulaylik maqsadi; WCAG minimal talabi sifatida ko‘rsatilmaydi.

## Ishonch va maxfiylik

- Har bir davlat xizmati rasmiy manbaga olib boradi.
- Manba, tekshirilgan sana va ma’lumot egasi alohida ko‘rsatiladi.
- Yoshlar-Ishi davlat bazasiga ulangan deb yozilmaydi, agar real API, ruxsat va xavfsiz test mavjud bo‘lmasa.
- JSHSHIR, pasport rasmi, SMS-kod, bank karta ma’lumoti yoki OneID paroli so‘ralmaydi.
- Moslik tavsiyasi rasmiy qaror yoki grant yutish ehtimoli sifatida ko‘rsatilmaydi.

## Benchmark

100 ta xalqaro davlat xizmati namunasi: [DESIGN_BENCHMARK_100.md](./DESIGN_BENCHMARK_100.md).
