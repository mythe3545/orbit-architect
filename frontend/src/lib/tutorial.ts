import type { Lang } from "@/lib/settings";

export interface TutStep { t: string; d: string }
export interface TutSection { id: string; title: string; intro: string; steps: TutStep[]; tip?: string; cta?: string }

/** Route each section's "go there" button opens. */
export const TUT_LINKS: Record<string, string> = {
  start: "/builder", build: "/builder", fleet: "/hangar", plan: "/launch", flight: "/launch", crises: "/launch",
  weather: "/launch", points: "/dossier", shop: "/hangar?tab=shop", achievements: "/achievements", weekly: "/launch", settings: "/settings",
};

export const TUT_UI: Record<Lang, { kicker: string; title: string; desc: string; toc: string; step: string; tip: string; go: string; loop: string[] }> = {
  en: { kicker: "Flight academy · Training manual", title: "How to play Orbital Forge", desc: "Everything you need, from your first bolt in the assembly building to riding a real solar storm. Read it top to bottom or jump to a chapter.", toc: "Chapters", step: "Step", tip: "Flight director's tip", go: "Open", loop: ["Design", "Launch", "Survive crises", "Earn points", "Upgrade & style"] },
  tr: { kicker: "Uçuş akademisi · Eğitim kılavuzu", title: "Orbital Forge nasıl oynanır?", desc: "Montaj binasındaki ilk vidadan gerçek bir güneş fırtınasını atlatmaya kadar bilmen gereken her şey burada. Baştan sona okuyabilir ya da istediğin bölüme atlayabilirsin.", toc: "Bölümler", step: "Adım", tip: "Uçuş direktörünün ipucu", go: "Aç", loop: ["Tasarla", "Fırlat", "Krizleri atlat", "Puan kazan", "Geliştir ve özelleştir"] },
  de: { kicker: "Flugakademie · Trainingshandbuch", title: "So spielst du Orbital Forge", desc: "Alles, was du brauchst: von der ersten Schraube in der Montagehalle bis zum Ritt durch einen echten Sonnensturm. Lies alles oder spring direkt zu einem Kapitel.", toc: "Kapitel", step: "Schritt", tip: "Tipp des Flugdirektors", go: "Öffnen", loop: ["Entwerfen", "Starten", "Krisen meistern", "Punkte sammeln", "Upgraden & gestalten"] },
};

export const TUTORIAL: Record<Lang, TutSection[]> = {
  tr: [
    { id: "start", title: "Başlarken", intro: "Orbital Forge'da bir NASA görev mimarısın. Gerçek NASA parçalarıyla roket tasarlar, bir hedef seçer, uçuş sırasında çıkan krizlerde zamana karşı karar verirsin. Her görev puan kazandırır; puanlarla roketini geliştirir ve tarzını değiştirirsin.", steps: [
      { t: "Astronot kaydı", d: "İlk girişte \"Yeni astronot\" sekmesinden adını, çağrı adını ve 4–6 haneli PIN'ini gir. Sonraki girişlerde \"Kayıtlı astronot\" sekmesinden çağrı adın ve PIN'inle girersin." },
      { t: "Oyun döngüsü", d: "Tasarla → Fırlat → Krizleri atlat → Puan kazan → Geliştir. Her tur bir öncekinden daha güçlü bir roketle başlar." },
      { t: "Üst bar", d: "Sağ üstte puanın, çağrı adın ve ünvanın görünür. Menüden Tasarım, Fırlatma, Filo, Profil, Başarımlar, Ayarlar ve bu Rehber'e geçersin." },
    ], tip: "Acele etme: ilk görevin için Filo'dan hazır bir roket seç, oyunu tanıdıktan sonra kendi tasarımına geç.", cta: "Tasarıma git" },
    { id: "build", title: "Roket tasarımı", intro: "Tasarım ekranı üç bölümden oluşur: solda NASA parça kütüphanesi, ortada tasarım planı, sağda telemetri ve uçuş mühendisliği rehberi. Roketi tıpkı NASA'nın montaj binasında olduğu gibi yukarıdan aşağıya dizersin.", steps: [
      { t: "Parça ekle", d: "Kütüphaneden bir parçayı plana sürükle ya da parçanın üzerindeki + düğmesine dokun. Kategori etiketleriyle (Kapsüller, Üst kademeler, Motorlar…) listeyi daralt, arama kutusuyla isimle bul." },
      { t: "Doğru sıra", d: "En üstte kapsül veya faydalı yük; altında üst kademe tankı ve onun motoru; gerekirse ara kademe adaptörü; en altta büyük çekirdek kademe ve ana motorlar. Yardımcı roketler çekirdeğin yanına bağlanır." },
      { t: "Yakıt uyumu", d: "Her tankın sol kenarındaki renk şeridi yakıt türünü gösterir. Motor, hemen üstündeki tankla aynı yakıtı yakmalı. Örneğin F-1 kerosen (RP-1/LOX) yakar, RS-25 sıvı hidrojen (LH2/LOX) yakar." },
      { t: "Motor kümeleme", d: "Bir motor satırındaki + ve – düğmeleriyle motor sayısını değiştir. Saturn V'in S-IC kademesi beş F-1 motoruyla uçar." },
      { t: "Değerleri oku", d: "İtki/Ağırlık oranı (TWR) 1'in üstünde olmalı, yoksa roket rampadan kalkamaz; NASA roketleri genelde 1,15–1,6 arası kalkar. Δv (delta-v), roketin hız değiştirme kapasitesidir; hedefin istediği Δv'ye ulaşmalısın." },
      { t: "Rehberi kullan", d: "Sağdaki rehber her hatayı açıklar ve uyumlu alternatifler önerir. \"Kullan\" düğmesi hatalı parçayı uygun olanla değiştirir. Tasarımın otomatik kaydedilir." },
    ], tip: "RL10 ve LR91 vakum motorlarıdır: uzayda çok verimlidir ama yerden kalkışta itki vermez. Onları sadece üst kademelerde kullan.", cta: "Tasarıma git" },
    { id: "fleet", title: "Hazır NASA roketleri", intro: "Filo & Yükseltmeler ekranında Saturn V'ten SLS'e, Uzay Mekiği'nden Falcon Heavy'ye kadar gerçek kademe yapısıyla kurulmuş 18 tarihi roket bulunur.", steps: [
      { t: "Doğrudan uç", d: "\"Bu roketi uçur\" roketi tasarımına yükler ve seni fırlatma ekranına götürür." },
      { t: "Değiştir", d: "\"Değiştir\" roketi tasarım ekranında açar. Bir kademe ekleyip çıkararak kendi versiyonunu yaratabilirsin." },
      { t: "Kartı oku", d: "Her kartta dönem, uçuş sayısı, yükseklik, kütle, TWR ve Δv değerleri bulunur. Uzak hedefler için Δv'si yüksek bir roket seç." },
    ], tip: "Merkür veya Neptün gibi uzak hedefler için SLS Block 1B ya da Falcon Heavy iyi bir başlangıçtır.", cta: "Filoyu aç" },
    { id: "plan", title: "Görev planlama", intro: "Fırlatma ekranında hedefini seçersin. Her gezegen kartında NASA bilgi sayfalarından gelen veriler ve canlı NASA fotoğrafı yer alır.", steps: [
      { t: "Δv çubuğu", d: "Kartın altındaki çubuk, roketinin hedefin istediği Δv'nin yüzde kaçını karşıladığını gösterir. %100'ün altı başarı şansını ciddi biçimde düşürür." },
      { t: "Ödüller", d: "Her hedefte görev ödülü ve ilk ziyarete özel keşif bonusu yazar. Uzak hedefler daha çok puan verir." },
      { t: "Zorluk", d: "Zorluk ayarı (Kolay, Normal, Zor) karar süreni ve puan çarpanını belirler: Kolay +8 sn ve ×0,8; Zor –6 sn ve ×1,3." },
    ], tip: "Alt çubuktaki \"Hedefine fırlat\" düğmesi, roketin uçuşa hazır değilse kilitli kalır; sebebi kırmızı kutuda yazar.", cta: "Fırlatmaya git" },
    { id: "flight", title: "Fırlatma ve uçuş", intro: "Fırlatmadan sonra sinematik bir uçuş başlar: geri sayım, ateşleme, Max-Q, kademe ayrılmaları, Dünya'dan ayrılış ve hedefe yolculuk.", steps: [
      { t: "Uçuş göstergeleri", d: "Üstte görev süresi, irtifa, hız ve hedef görünür. Alttaki ilerleme çubuğundaki noktalar krizlerin geleceği anlardır." },
      { t: "Araç sistemleri", d: "Sağdaki panel yakıt, gövde bütünlüğü, güç ve dış kalkan değerlerini gösterir. Bunlardan biri sıfıra düşerse görev başarısız sayılır." },
      { t: "Uçuş direktörü", d: "Direktör mesajları kalan tehlikeleri ve sıradaki olayları anlatır." },
    ], tip: "Animasyon hızını ve kamera sarsıntısını Ayarlar'dan değiştirebilirsin.", cta: "Fırlatmaya git" },
    { id: "crises", title: "Krizler ve kararlar", intro: "Uçuş sırasında alarm çalar ve bir kriz kartı açılır. Gerçek NASA olaylarından esinlenen bu krizlerde süre dolmadan üç seçenekten birini seçmelisin.", steps: [
      { t: "Zamanlayıcı", d: "Karttaki sayaç sıfıra inerse otomatik sistemler devreye girer ve sonuç genellikle kötüdür." },
      { t: "Karar notu", d: "Her karar EN İYİ KARAR, KABUL EDİLEBİLİR veya KÖTÜ KARAR olarak değerlendirilir. En iyi karar en çok puanı verir ve sistemlere en az zarar verir." },
      { t: "Sonuçlar", d: "Kötü kararlar yakıt, gövde, güç veya kalkan kaybettirir. Karar sonrası açıklamayı okuyup \"Uçuşa devam\" ile ilerle." },
      { t: "Gerçek tarih", d: "Kartlardaki NASA kaynağı satırı, krizin hangi gerçek olaydan alındığını anlatır (Apollo 13, Gemini 8, Apollo 11'in 1202 alarmı gibi)." },
    ], tip: "Seçeneklerin sırası her görevde karışır; ezber yerine durumu oku.", cta: "Fırlatmaya git" },
    { id: "weather", title: "Uzay hava durumu (NASA DONKI)", intro: "Fırlatma ve yolculuk krizlerinin çoğu NASA'nın DONKI veritabanındaki gerçek uzay hava olaylarından üretilir. Panel, verinin nereden geldiğini etiketle gösterir: CANLI AKIŞ (bugün), SON 30 GÜN veya ARŞİV RAPORU.", steps: [
      { t: "Güneş patlaması (FLR)", d: "M veya X sınıfı patlama kokpitte radyasyon alarmı başlatır. Ekibi korumak için doğru sığınak kararını ver." },
      { t: "Güneş enerjik parçacıkları (SEP)", d: "Proton fırtınası dış kalkanı hızla aşındırır. Kalkan çubuğunu izle." },
      { t: "Jeomanyetik fırtına (GST)", d: "Güç hattı kararsızlaşır. Kriz kartındaki güç regülatörünü doğru yüke ayarlamalısın." },
      { t: "Gezegenlerarası şok (IPS)", d: "Görüntüde parazit oluşur ve atalet referansı kaybolur; aracı yeniden dengelemelisin." },
      { t: "Koronal kütle atımı (CME)", d: "Rotanın üzerinde dev bir plazma dalgası belirir. Kalkanı güçlendirmek ya da rotayı değiştirmek arasında seçim yap." },
      { t: "Zorlukla ilişkisi", d: "Zor seviyede en şiddetli olaylar seçilir. Kolay seviyede daha hafif olaylar gelir." },
    ], tip: "Fırlatma ekranında Shift+S ile gizli simülasyon panelini açıp istediğin olayı sıraya ekleyerek pratik yapabilirsin.", cta: "Fırlatmaya git" },
    { id: "points", title: "Puanlar", intro: "Görev raporu kazandığın puanları ayrıntılı gösterir. Puanlar üst barda toplanır ve Profil sayfasında tüm geçmişin listelenir.", steps: [
      { t: "Görev ödülü", d: "Tam başarıda hedefin ödülünün tamamı, kısmi başarıda bir kısmı verilir." },
      { t: "Engel puanı", d: "Aştığın her kriz karar kalitesine göre puan kazandırır." },
      { t: "Keşif bonusu", d: "Bir gök cismine ilk kez ulaştığında büyük bir keşif bonusu alırsın." },
      { t: "Ekstralar", d: "Zorluk çarpanı, yeni başarımların bonusları ve haftalık görev bonusu toplama eklenir." },
    ], tip: "Başarı puanı %80 ve üzeri tam başarı, %45–79 kısmi başarı sayılır.", cta: "Profilimi aç" },
    { id: "shop", title: "Yükseltmeler ve stil mağazası", intro: "Puanlarını Filo & Yükseltmeler ekranında iki şekilde harcarsın: performans yükseltmeleri ve görsel stiller.", steps: [
      { t: "Yükseltme deposu", d: "Motor verimi, hafif yapılar, yakıt yalıtımı, ısı kalkanı ve navigasyon yapay zekâsı. Her seviye tüm roketlerini güçlendirir." },
      { t: "Roket boyaları", d: "Altın folyo, karbon, Mars pası, bulutsu, V-2 damalı desen ve daha fazlası." },
      { t: "Motor alevleri ve uçuş izleri", d: "Hidrojen mavisi, plazma moru gibi alev renkleri ve kıvılcım, iyon akışı, yıldız tozu, kutup ışığı gibi izler uçuşta görünür." },
      { t: "Menü temaları", d: "Arayüzün tüm renklerini değiştirir. Üç tema ücretsizdir, özel temalar mağazadan açılır." },
      { t: "Kullan", d: "Satın aldığın her şey anında kullanılır. Daha sonra Ayarlar'dan ya da mağazadan istediğin zaman değiştirebilirsin." },
    ], tip: "Önce Motor Özgül İtkisi yükseltmesini al: tüm roketlerinin Δv değeri artar ve uzak hedefler kolaylaşır.", cta: "Mağazayı aç" },
    { id: "achievements", title: "Başarımlar ve ünvanlar", intro: "Görev sonunda koşulları sağladığın başarımlar ışıltılı bir pencereyle açılır ve ekstra puan kazandırır.", steps: [
      { t: "11 başarım", d: "İlk ateşleme, Ay yürüyüşçüsü, kusursuz uçuş, fırtına binicisi, mükemmel skor ve daha fazlası. Her birinin açıklaması Başarımlar sayfasındadır." },
      { t: "5 ünvan", d: "Uzay Öğrencisi (0) → Yörünge Pilotu (2) → Görev Komutanı (4) → Uçuş Direktörü (7) → Uzay Efsanesi (10 başarım)." },
      { t: "İlerleme", d: "Başarımlar sayfasındaki çubuk, bir sonraki ünvana kaç başarım kaldığını gösterir." },
    ], tip: "\"Kusursuz Uçuş\" için bir görevdeki tüm krizlerde en iyi kararı vermelisin.", cta: "Başarımları aç" },
    { id: "weekly", title: "Haftalık görev", intro: "Her hafta son 7 günün en güçlü gerçek uzay hava olayından özel bir görev oluşturulur. Görev her pazartesi yenilenir.", steps: [
      { t: "Kabul et", d: "Fırlatma ekranındaki haftalık görev kartında \"Görevi kabul et\"e dokun; hedef otomatik seçilir." },
      { t: "Gerçek olay", d: "Haftanın gerçek NASA olayı ilk krizin olarak karşına çıkar." },
      { t: "Bonus", d: "Tam başarı elde edersen olayın şiddetine göre 300–600 bonus puan kazanırsın. Bonus haftada bir kez verilir." },
    ], tip: "Haftalık görevi Zor seviyede tamamlarsan bonus da zorluk çarpanıyla artar.", cta: "Fırlatmaya git" },
    { id: "settings", title: "Ayarlar ve ipuçları", intro: "Ayarlar bu cihaza kaydedilir ve anında uygulanır.", steps: [
      { t: "Ses", d: "Ses efektlerini aç/kapat ve ses seviyesini ayarla; \"Sesi dene\" ile kontrol et." },
      { t: "Dil", d: "Türkçe, İngilizce ve Almanca arasında geçiş yap. Görev metinleri ve krizler de seçtiğin dilde gelir." },
      { t: "Görünüm", d: "Menü renkleri, roket boyası, alev ve iz seçimlerini buradan değiştir." },
      { t: "Animasyon", d: "Uçuş hızını 0,5× ile 2× arasında ayarla, kamera sarsıntısını aç ya da kapat." },
      { t: "Telefona ekle", d: "Tarayıcıda Paylaş → Ana Ekrana Ekle ile uygulamayı telefonuna kurabilirsin." },
    ], cta: "Ayarları aç" },
  ],
  en: [
    { id: "start", title: "Getting started", intro: "In Orbital Forge you are a NASA mission architect. You design rockets from real NASA hardware, pick a destination and make split-second calls when crises hit in flight. Every mission earns points that upgrade your rockets and unlock new styles.", steps: [
      { t: "Enrol as an astronaut", d: "On your first visit use the \"New astronaut\" tab: enter your name, a callsign and a 4–6 digit PIN. Next time, sign in on the \"Returning crew\" tab with your callsign and PIN." },
      { t: "The game loop", d: "Design → Launch → Survive crises → Earn points → Upgrade. Every round starts with a stronger rocket than the last." },
      { t: "Top bar", d: "Your points, callsign and title sit at the top right. The menu takes you to Builder, Launch, Fleet, Dossier, Achievements, Settings and this Guide." },
    ], tip: "Take it easy: fly a ready-made rocket from the Fleet first, then move on to your own designs.", cta: "Open builder" },
    { id: "build", title: "Designing a rocket", intro: "The builder has three areas: the NASA parts library on the left, the blueprint in the middle, and telemetry plus the flight-engineering guide on the right. You stack the rocket top to bottom, just like NASA does in the Vehicle Assembly Building.", steps: [
      { t: "Add parts", d: "Drag a part onto the blueprint or tap its + button. Narrow the list with the category tags (capsules, upper stages, engines…) or search by name." },
      { t: "Stack order", d: "Capsule or payload on top; below it an upper-stage tank and its engine; an interstage adapter if needed; at the bottom the big core stage with its main engines. Boosters strap onto the core." },
      { t: "Matching propellant", d: "The colour stripe on each tank shows its propellant. An engine must burn the same propellant as the tank directly above it: the F-1 burns kerosene (RP-1/LOX), the RS-25 burns liquid hydrogen (LH2/LOX)." },
      { t: "Cluster engines", d: "Use + and – on an engine row to change how many engines are clustered. Saturn V's S-IC flies with five F-1s." },
      { t: "Read the numbers", d: "Thrust-to-weight (TWR) must be above 1 or the rocket cannot leave the pad; NASA rockets lift off at about 1.15–1.6. Δv (delta-v) is how much velocity the rocket can change. You need the Δv your destination requires." },
      { t: "Use the guide", d: "The guide explains every problem and suggests compatible alternatives. \"Use\" swaps the faulty part for a working one. Your design saves automatically." },
    ], tip: "RL10 and LR91 are vacuum engines: superb in space, but no thrust at liftoff. Use them only on upper stages.", cta: "Open builder" },
    { id: "fleet", title: "Ready-made NASA rockets", intro: "Fleet & Upgrades holds 18 historic rockets, from Saturn V to SLS and from the Space Shuttle to Falcon Heavy, each built from its real stage stack.", steps: [
      { t: "Fly it", d: "\"Fly this rocket\" loads it as your design and takes you to launch." },
      { t: "Modify it", d: "\"Modify\" opens the rocket in the builder so you can add or remove stages and make your own version." },
      { t: "Read the card", d: "Each card shows era, flights, height, mass, TWR and Δv. Choose a high-Δv rocket for distant targets." },
    ], tip: "For far targets like Mercury or Neptune, SLS Block 1B or Falcon Heavy is a good start.", cta: "Open fleet" },
    { id: "plan", title: "Mission planning", intro: "On the Launch screen you choose a destination. Each planet card shows data from NASA fact sheets and a live NASA photo.", steps: [
      { t: "Δv bar", d: "The bar shows what share of the destination's required Δv your rocket provides. Below 100% your odds drop sharply." },
      { t: "Rewards", d: "Each target lists its mission reward and a first-visit exploration bonus. Farther targets pay more." },
      { t: "Difficulty", d: "Easy, Normal or Hard sets your decision time and point multiplier: Easy +8 s and ×0.8, Hard –6 s and ×1.3." },
    ], tip: "The \"Launch to …\" button stays locked while the rocket is not flight-ready; the red box tells you why.", cta: "Open launch" },
    { id: "flight", title: "Launch and flight", intro: "After launch a cinematic flight plays: countdown, ignition, Max-Q, staging, leaving Earth and the transit to your target.", steps: [
      { t: "Flight HUD", d: "Mission time, altitude, velocity and target are shown at the top. Dots on the progress bar mark when crises will hit." },
      { t: "Vehicle systems", d: "The side panel tracks propellant, hull integrity, power and outer shield. If any reaches zero, the mission fails." },
      { t: "Flight director", d: "Director messages describe the remaining hazards and upcoming events." },
    ], tip: "Change animation speed and camera shake in Settings.", cta: "Open launch" },
    { id: "crises", title: "Crises and decisions", intro: "Mid-flight the master alarm sounds and a crisis card opens. Inspired by real NASA events, each crisis gives you three options and a countdown.", steps: [
      { t: "The timer", d: "If the countdown hits zero, automated systems step in and the outcome is usually bad." },
      { t: "Decision rating", d: "Each call is rated OPTIMAL, ACCEPTABLE or POOR. The optimal call earns the most points and causes the least damage." },
      { t: "Consequences", d: "Poor calls cost propellant, hull, power or shield. Read the outcome, then press \"Continue flight\"." },
      { t: "Real history", d: "The NASA reference line tells you which real event inspired the crisis, such as Apollo 13, Gemini 8 or Apollo 11's 1202 alarm." },
    ], tip: "Option order is shuffled every mission. Read the situation instead of memorising.", cta: "Open launch" },
    { id: "weather", title: "Space weather (NASA DONKI)", intro: "Most launch and transit crises are generated from real space-weather events in NASA's DONKI database. A badge shows where the data comes from: LIVE FEED (today), 30-DAY ARCHIVE or ARCHIVE REPORT.", steps: [
      { t: "Solar flare (FLR)", d: "An M- or X-class flare triggers a radiation alarm in the cockpit. Pick the right shelter decision to protect the crew." },
      { t: "Solar energetic particles (SEP)", d: "A proton storm rapidly erodes the outer shield. Watch the shield bar." },
      { t: "Geomagnetic storm (GST)", d: "The power bus becomes unstable. Set the power regulator on the crisis card to the right load." },
      { t: "Interplanetary shock (IPS)", d: "The display glitches and the inertial reference is lost. Re-stabilise the vehicle." },
      { t: "Coronal mass ejection (CME)", d: "A huge plasma wave appears on your route. Choose between hardening the shield and changing course." },
      { t: "Difficulty", d: "Hard picks the most severe events, Easy picks milder ones." },
    ], tip: "Press Shift+S on the Launch screen to open the hidden simulation panel and queue any event for practice.", cta: "Open launch" },
    { id: "points", title: "Points", intro: "The mission report breaks down everything you earned. Points collect in the top bar, and your Dossier lists your whole history.", steps: [
      { t: "Mission reward", d: "Full success pays the destination's whole reward; partial success pays part of it." },
      { t: "Obstacle points", d: "Every crisis you overcome pays according to the quality of your decision." },
      { t: "Exploration bonus", d: "Reaching a body for the first time pays a large exploration bonus." },
      { t: "Extras", d: "The difficulty multiplier, new achievement bonuses and the weekly challenge bonus are added on top." },
    ], tip: "A mission score of 80% or more is a full success; 45–79% is a partial success.", cta: "Open dossier" },
    { id: "shop", title: "Upgrades and the style shop", intro: "Spend points in Fleet & Upgrades in two ways: performance upgrades and visual styles.", steps: [
      { t: "Upgrade depot", d: "Engine efficiency, lightweight structures, fuel insulation, heat shield and navigation AI. Every level improves all your rockets." },
      { t: "Rocket paints", d: "Gold foil, carbon, Mars rust, nebula, the V-2 test checker and more." },
      { t: "Engine flames and trails", d: "Flame colours like hydrogen blue and plasma violet, and trails like ember sparks, ion stream, stardust and aurora ribbon, all visible in flight." },
      { t: "Menu themes", d: "Recolour the whole interface. Three themes are free; special ones unlock in the shop." },
      { t: "Equip", d: "Anything you buy is applied immediately. Switch any time from Settings or the shop." },
    ], tip: "Buy Engine Specific Impulse first: every rocket gains Δv and far targets get easier.", cta: "Open shop" },
    { id: "achievements", title: "Achievements and titles", intro: "When a mission ends, every achievement you met opens in a glowing pop-up and pays bonus points.", steps: [
      { t: "11 achievements", d: "First Ignition, Moonwalker, Flawless Flight, Storm Rider, Perfect Score and more. Each one is described on the Achievements page." },
      { t: "5 titles", d: "Space Cadet (0) → Orbital Pilot (2) → Mission Commander (4) → Flight Director (7) → Space Legend (10 achievements)." },
      { t: "Progress", d: "The bar on the Achievements page shows how many achievements you need for the next title." },
    ], tip: "For \"Flawless Flight\" make the optimal call on every crisis of a mission.", cta: "Open achievements" },
    { id: "weekly", title: "Weekly challenge", intro: "Each week a special mission is built from the strongest real space-weather event of the past 7 days. It resets every Monday.", steps: [
      { t: "Accept", d: "Tap \"Accept challenge\" on the weekly card on the Launch screen. The destination is selected for you." },
      { t: "Real event", d: "That week's real NASA event becomes your first crisis." },
      { t: "Bonus", d: "A full success pays 300–600 bonus points, depending on the event's severity. It is paid once per week." },
    ], tip: "Finish the weekly challenge on Hard and the bonus gets the difficulty multiplier too.", cta: "Open launch" },
    { id: "settings", title: "Settings and tips", intro: "Settings are saved on this device and apply instantly.", steps: [
      { t: "Sound", d: "Turn sound effects on or off and set the volume; check with \"Test sound\"." },
      { t: "Language", d: "Switch between Turkish, English and German. Missions and crises follow your language too." },
      { t: "Appearance", d: "Change menu colours, rocket paint, flame and trail here." },
      { t: "Animation", d: "Set flight speed from 0.5× to 2× and toggle camera shake." },
      { t: "Install on your phone", d: "In your browser choose Share → Add to Home Screen to install the app." },
    ], cta: "Open settings" },
  ],
  de: [
    { id: "start", title: "Erste Schritte", intro: "In Orbital Forge bist du NASA-Missionsarchitekt. Du baust Raketen aus echter NASA-Hardware, wählst ein Ziel und triffst im Flug blitzschnelle Entscheidungen, wenn Krisen auftreten. Jede Mission bringt Punkte für Upgrades und neue Styles.", steps: [
      { t: "Als Astronaut registrieren", d: "Beim ersten Besuch im Tab \"Neuer Astronaut\" Name, Rufzeichen und eine 4–6-stellige PIN eingeben. Danach meldest du dich im Tab \"Bestehende Crew\" mit Rufzeichen und PIN an." },
      { t: "Der Spielablauf", d: "Entwerfen → Starten → Krisen meistern → Punkte sammeln → Upgraden. Jede Runde beginnt mit einer stärkeren Rakete." },
      { t: "Obere Leiste", d: "Oben rechts siehst du Punkte, Rufzeichen und Titel. Über das Menü erreichst du Baukasten, Start, Flotte, Dossier, Erfolge, Einstellungen und diese Anleitung." },
    ], tip: "Fliege zuerst eine fertige Rakete aus der Flotte und wechsle dann zu eigenen Entwürfen.", cta: "Baukasten öffnen" },
    { id: "build", title: "Eine Rakete entwerfen", intro: "Der Baukasten hat drei Bereiche: links die NASA-Teilebibliothek, in der Mitte den Bauplan, rechts Telemetrie und den Flugtechnik-Assistenten. Du stapelst von oben nach unten, wie die NASA im Vehicle Assembly Building.", steps: [
      { t: "Teile hinzufügen", d: "Ziehe ein Teil auf den Bauplan oder tippe auf +. Filtere mit den Kategorien (Kapseln, Oberstufen, Triebwerke…) oder suche nach Namen." },
      { t: "Reihenfolge", d: "Oben Kapsel oder Nutzlast, darunter Oberstufentank und Triebwerk, bei Bedarf ein Adapter, unten die große Kernstufe mit Haupttriebwerken. Booster werden seitlich angebracht." },
      { t: "Passender Treibstoff", d: "Der Farbstreifen am Tank zeigt den Treibstoff. Ein Triebwerk muss denselben Treibstoff verbrennen wie der Tank direkt darüber: F-1 nutzt Kerosin (RP-1/LOX), RS-25 Flüssigwasserstoff (LH2/LOX)." },
      { t: "Triebwerke bündeln", d: "Mit + und – in der Triebwerkszeile änderst du die Anzahl. Die S-IC der Saturn V fliegt mit fünf F-1." },
      { t: "Werte verstehen", d: "Das Schub-Gewichts-Verhältnis (TWR) muss über 1 liegen, sonst hebt die Rakete nicht ab; NASA-Raketen starten mit etwa 1,15–1,6. Δv ist die mögliche Geschwindigkeitsänderung. Du brauchst das Δv, das dein Ziel verlangt." },
      { t: "Assistent nutzen", d: "Der Assistent erklärt jedes Problem und schlägt kompatible Alternativen vor. \"Nutzen\" tauscht das fehlerhafte Teil aus. Dein Entwurf wird automatisch gespeichert." },
    ], tip: "RL10 und LR91 sind Vakuumtriebwerke: im All hervorragend, beim Start ohne Schub. Nutze sie nur in Oberstufen.", cta: "Baukasten öffnen" },
    { id: "fleet", title: "Fertige NASA-Raketen", intro: "In Flotte & Upgrades findest du 18 historische Raketen, von Saturn V bis SLS und vom Space Shuttle bis Falcon Heavy, jeweils mit echtem Stufenaufbau.", steps: [
      { t: "Direkt fliegen", d: "\"Diese Rakete fliegen\" lädt sie als Entwurf und öffnet den Start." },
      { t: "Ändern", d: "\"Ändern\" öffnet die Rakete im Baukasten, damit du Stufen hinzufügen oder entfernen kannst." },
      { t: "Karte lesen", d: "Jede Karte zeigt Ära, Flüge, Höhe, Masse, TWR und Δv. Für ferne Ziele wählst du eine Rakete mit viel Δv." },
    ], tip: "Für Merkur oder Neptun sind SLS Block 1B und Falcon Heavy ein guter Start.", cta: "Flotte öffnen" },
    { id: "plan", title: "Missionsplanung", intro: "Im Startbildschirm wählst du dein Ziel. Jede Planetenkarte zeigt Daten aus NASA-Datenblättern und ein aktuelles NASA-Foto.", steps: [
      { t: "Δv-Balken", d: "Der Balken zeigt, wie viel des nötigen Δv deine Rakete liefert. Unter 100 % sinken deine Chancen deutlich." },
      { t: "Belohnungen", d: "Jedes Ziel nennt Missionsbelohnung und Erstbesuch-Bonus. Fernere Ziele bringen mehr." },
      { t: "Schwierigkeit", d: "Leicht, Normal oder Schwer bestimmt Entscheidungszeit und Punktefaktor: Leicht +8 s und ×0,8, Schwer –6 s und ×1,3." },
    ], tip: "Der Startknopf bleibt gesperrt, solange die Rakete nicht flugbereit ist; der rote Kasten nennt den Grund.", cta: "Start öffnen" },
    { id: "flight", title: "Start und Flug", intro: "Nach dem Start läuft ein filmischer Flug: Countdown, Zündung, Max-Q, Stufentrennungen, Abschied von der Erde und Transfer zum Ziel.", steps: [
      { t: "Flug-HUD", d: "Oben stehen Missionszeit, Höhe, Geschwindigkeit und Ziel. Punkte auf dem Fortschrittsbalken markieren die Krisen." },
      { t: "Fahrzeugsysteme", d: "Das Seitenpanel zeigt Treibstoff, Rumpfintegrität, Energie und Außenschild. Fällt ein Wert auf null, scheitert die Mission." },
      { t: "Flugdirektor", d: "Die Meldungen des Direktors beschreiben verbleibende Gefahren und kommende Ereignisse." },
    ], tip: "Animationstempo und Kamerawackeln stellst du in den Einstellungen ein.", cta: "Start öffnen" },
    { id: "crises", title: "Krisen und Entscheidungen", intro: "Im Flug ertönt der Hauptalarm und eine Krisenkarte öffnet sich. Jede Krise basiert auf echten NASA-Ereignissen und bietet drei Optionen mit Countdown.", steps: [
      { t: "Der Countdown", d: "Läuft er ab, greift die Automatik ein, meist mit schlechtem Ergebnis." },
      { t: "Bewertung", d: "Jede Entscheidung wird als OPTIMAL, AKZEPTABEL oder SCHLECHT bewertet. Optimal bringt die meisten Punkte und den geringsten Schaden." },
      { t: "Folgen", d: "Schlechte Entscheidungen kosten Treibstoff, Rumpf, Energie oder Schild. Lies das Ergebnis und drücke \"Flug fortsetzen\"." },
      { t: "Echte Geschichte", d: "Die NASA-Referenz nennt das reale Vorbild, etwa Apollo 13, Gemini 8 oder den 1202-Alarm von Apollo 11." },
    ], tip: "Die Reihenfolge der Optionen wird jede Mission gemischt. Lies die Lage, statt auswendig zu lernen.", cta: "Start öffnen" },
    { id: "weather", title: "Weltraumwetter (NASA DONKI)", intro: "Die meisten Start- und Transferkrisen entstehen aus echten Weltraumwetter-Ereignissen der NASA-Datenbank DONKI. Ein Etikett zeigt die Quelle: LIVE-FEED (heute), 30-TAGE-ARCHIV oder ARCHIVBERICHT.", steps: [
      { t: "Sonneneruption (FLR)", d: "Eine M- oder X-Klasse-Eruption löst im Cockpit Strahlungsalarm aus. Wähle den richtigen Schutz für die Crew." },
      { t: "Energiereiche Sonnenteilchen (SEP)", d: "Ein Protonensturm zehrt schnell am Außenschild. Behalte den Schildbalken im Blick." },
      { t: "Geomagnetischer Sturm (GST)", d: "Das Bordnetz wird instabil. Stelle den Leistungsregler auf der Krisenkarte auf die richtige Last." },
      { t: "Interplanetarer Schock (IPS)", d: "Das Bild flackert und die Trägheitsreferenz geht verloren. Stabilisiere das Fahrzeug." },
      { t: "Koronaler Massenauswurf (CME)", d: "Eine riesige Plasmawelle liegt auf deiner Route. Wähle zwischen Schild verstärken und Kurs ändern." },
      { t: "Schwierigkeit", d: "Schwer wählt die stärksten Ereignisse, Leicht mildere." },
    ], tip: "Mit Shift+S öffnest du im Startbildschirm das versteckte Simulationspanel und kannst Ereignisse zum Üben einreihen.", cta: "Start öffnen" },
    { id: "points", title: "Punkte", intro: "Der Missionsbericht schlüsselt alle Punkte auf. Sie sammeln sich in der oberen Leiste, dein Dossier listet die gesamte Historie.", steps: [
      { t: "Missionsbelohnung", d: "Voller Erfolg bringt die ganze Belohnung, Teilerfolg einen Teil davon." },
      { t: "Hindernispunkte", d: "Jede gemeisterte Krise zahlt je nach Qualität deiner Entscheidung." },
      { t: "Erkundungsbonus", d: "Der erste Besuch eines Himmelskörpers bringt einen großen Bonus." },
      { t: "Extras", d: "Schwierigkeitsfaktor, Erfolgsboni und der Bonus der Wochen-Challenge kommen hinzu." },
    ], tip: "Ab 80 % Missionswertung gilt die Mission als voller Erfolg, 45–79 % als Teilerfolg.", cta: "Dossier öffnen" },
    { id: "shop", title: "Upgrades und Style-Shop", intro: "In Flotte & Upgrades gibst du Punkte auf zwei Arten aus: für Leistungs-Upgrades und für Styles.", steps: [
      { t: "Upgrade-Depot", d: "Triebwerkseffizienz, Leichtbau, Treibstoffisolierung, Hitzeschild und Navigations-KI. Jede Stufe verbessert alle Raketen." },
      { t: "Lackierungen", d: "Goldfolie, Carbon, Marsrost, Nebel, das V-2-Testkaro und mehr." },
      { t: "Flammen und Spuren", d: "Flammenfarben wie Wasserstoff-Blau und Plasma-Violett sowie Spuren wie Funkenflug, Ionenstrom, Sternenstaub und Polarlichtband, alle im Flug sichtbar." },
      { t: "Menüthemen", d: "Färben die ganze Oberfläche um. Drei Themen sind gratis, besondere schaltest du im Shop frei." },
      { t: "Verwenden", d: "Gekaufte Styles werden sofort angewendet und lassen sich jederzeit in den Einstellungen oder im Shop wechseln." },
    ], tip: "Kaufe zuerst den spezifischen Impuls: Alle Raketen gewinnen Δv und ferne Ziele werden leichter.", cta: "Shop öffnen" },
    { id: "achievements", title: "Erfolge und Titel", intro: "Am Missionsende öffnet sich jeder erreichte Erfolg in einem leuchtenden Pop-up und bringt Bonuspunkte.", steps: [
      { t: "11 Erfolge", d: "Erste Zündung, Mondgänger, Makelloser Flug, Sturmreiter, Perfekte Wertung und mehr. Alle sind auf der Erfolgsseite beschrieben." },
      { t: "5 Titel", d: "Weltraumkadett (0) → Orbitalpilot (2) → Missionskommandant (4) → Flugdirektor (7) → Weltraumlegende (10 Erfolge)." },
      { t: "Fortschritt", d: "Der Balken auf der Erfolgsseite zeigt, wie viele Erfolge zum nächsten Titel fehlen." },
    ], tip: "Für \"Makelloser Flug\" musst du in jeder Krise einer Mission optimal entscheiden.", cta: "Erfolge öffnen" },
    { id: "weekly", title: "Wochen-Challenge", intro: "Jede Woche entsteht eine besondere Mission aus dem stärksten echten Weltraumwetter-Ereignis der letzten 7 Tage. Sie wird jeden Montag erneuert.", steps: [
      { t: "Annehmen", d: "Tippe im Startbildschirm auf der Wochenkarte auf \"Challenge annehmen\". Das Ziel wird automatisch gewählt." },
      { t: "Echtes Ereignis", d: "Das echte NASA-Ereignis der Woche wird deine erste Krise." },
      { t: "Bonus", d: "Ein voller Erfolg bringt je nach Stärke 300–600 Bonuspunkte, einmal pro Woche." },
    ], tip: "Auf Schwer gilt der Schwierigkeitsfaktor auch für den Bonus.", cta: "Start öffnen" },
    { id: "settings", title: "Einstellungen und Tipps", intro: "Einstellungen werden auf diesem Gerät gespeichert und sofort angewendet.", steps: [
      { t: "Ton", d: "Soundeffekte an/aus und Lautstärke einstellen; mit \"Ton testen\" prüfen." },
      { t: "Sprache", d: "Wechsle zwischen Türkisch, Englisch und Deutsch. Missionen und Krisen folgen deiner Sprache." },
      { t: "Aussehen", d: "Menüfarben, Lackierung, Flamme und Spur hier ändern." },
      { t: "Animation", d: "Fluggeschwindigkeit von 0,5× bis 2× wählen und Kamerawackeln umschalten." },
      { t: "Aufs Handy", d: "Im Browser Teilen → Zum Home-Bildschirm wählen, um die App zu installieren." },
    ], cta: "Einstellungen öffnen" },
  ],
};
