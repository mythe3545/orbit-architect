"""Localised part names + descriptions (TR / DE). English lives in data/nasa.py."""

# id: (tr_name, tr_desc, de_name, de_desc)
PARTS = {
    "mercury": ("Mercury Kapsülü", "İlk Amerikalı astronotları taşıyan tek kişilik kapsül.", "Mercury-Kapsel", "Einsitzige Kapsel, die die ersten US-Astronauten trug."),
    "gemini": ("Gemini Uzay Aracı", "Uzayda buluşmayı ve uzay yürüyüşünü kanıtlayan iki kişilik araç.", "Gemini-Raumschiff", "Zweisitziges Raumschiff, das Rendezvous und Außenbordeinsätze erprobte."),
    "apollo_csm": ("Apollo Komuta/Servis Modülü", "AJ10 Servis İtki Sistemiyle donatılmış üç kişilik modül.", "Apollo-Kommando-/Servicemodul", "Dreisitziges Modul mit dem AJ10-Hauptantrieb (SPS)."),
    "apollo_lm": ("Apollo Ay Modülü", "Ay'a altı kez inen iki kademeli iniş aracı.", "Apollo-Mondlandefähre", "Zweistufige Fähre, die sechsmal auf dem Mond landete."),
    "orion": ("Orion Mürettebat Modülü + ESM", "Avrupa Servis Modülü ile birlikte Artemis mürettebat aracı.", "Orion-Crewmodul + ESM", "Artemis-Crewfahrzeug mit dem Europäischen Servicemodul."),
    "crew_dragon": ("Crew Dragon (Ticari Mürettebat)", "Astronotları ISS'e taşıyan NASA Ticari Mürettebat kapsülü.", "Crew Dragon (Commercial Crew)", "Kapsel des NASA-Commercial-Crew-Programms für Flüge zur ISS."),
    "shuttle_orbiter": ("Uzay Mekiği Yörünge Aracı", "Yeniden kullanılabilir kanatlı araç; 135 görev uçtu.", "Space-Shuttle-Orbiter", "Wiederverwendbarer geflügelter Orbiter mit 135 Missionen."),
    "perseverance": ("Perseverance Gezgini + Seyir Kademesi", "Mars 2020 gezgini, seyir kademesi ve aerodinamik kabuğu.", "Perseverance-Rover + Marschstufe", "Mars-2020-Rover mit Marschstufe und Hitzeschutzhülle."),
    "parker_probe": ("Parker Güneş Sondası + Star 48BV", "İnsan yapımı en hızlı nesne ve onu hızlandıran itme kademesi.", "Parker Solar Probe + Star 48BV", "Schnellstes von Menschen gebautes Objekt mit seiner Kickstufe."),
    "apollo_les": ("Apollo Fırlatma Kaçış Sistemi", "Acil iptalde mürettebatı güvenli mesafeye çeken katı yakıtlı kule.", "Apollo-Rettungsturm", "Feststoffturm, der die Crew bei einem Abbruch in Sicherheit zieht."),
    "s_ivb": ("S-IVB Üçüncü Kademe", "Ay'a transfer yanmasını yapan, yeniden ateşlenebilen kademe.", "S-IVB-Drittstufe", "Wiederzündbare Stufe, die die Mondtransferzündung ausführte."),
    "s_ii": ("S-II İkinci Kademe", "Döneminin en büyük sıvı hidrojen kademesi.", "S-II-Zweitstufe", "Größte Flüssigwasserstoffstufe ihrer Zeit."),
    "centaur": ("Centaur Üst Kademe", "ABD'nin ilk hidrojen üst kademesi; Surveyor, Voyager ve Perseverance'ı fırlattı.", "Centaur-Oberstufe", "Erste US-Wasserstoffoberstufe; startete Surveyor, Voyager und Perseverance."),
    "icps": ("ICPS (Geçici Kriyojenik İtki Kademesi)", "Orion'u Dünya yörüngesinden Ay'a doğru gönderir.", "ICPS (kryogene Interimsstufe)", "Schickt Orion aus der Erdumlaufbahn zum Mond."),
    "dcss": ("Delta Kriyojenik İkinci Kademe", "Parker Güneş Sondası'nı Güneş'e gönderen Delta IV üst kademesi.", "Delta-Kryo-Zweitstufe", "Delta-IV-Oberstufe, die die Parker Solar Probe zur Sonne schickte."),
    "titan_ii_s2": ("Titan II İkinci Kademe", "Gemini fırlatıcısının hipergolik ikinci kademesi.", "Titan-II-Zweitstufe", "Hypergole Zweitstufe der Gemini-Trägerrakete."),
    "saturn_interstage": ("Saturn V Ara Kademesi", "Kademeleri birbirine bağlayan ve ayrılmada atılan halka.", "Saturn-V-Zwischenstufe", "Ring, der die Stufen verbindet und bei der Trennung abgeworfen wird."),
    "sls_lvsa": ("SLS Kademe Adaptörü (LVSA)", "8,4 m'lik çekirdeği 5 m'lik ICPS'e daraltır.", "SLS-Stufenadapter (LVSA)", "Verjüngt die 8,4-m-Kernstufe auf die 5-m-ICPS."),
    "orion_adapter": ("Orion Kademe Adaptörü", "Orion'u ICPS'e bağlar; küp uyduları taşır.", "Orion-Stufenadapter", "Verbindet Orion mit der ICPS und trägt CubeSats."),
    "s_ic": ("S-IC Birinci Kademe", "Saturn V'in 168 saniye yanan birinci kademesi.", "S-IC-Erststufe", "Erststufe der Saturn V mit 168 Sekunden Brenndauer."),
    "sls_core": ("SLS Çekirdek Kademe", "Dört RS-25 motorlu, 64,6 m yüksekliğinde çekirdek kademe.", "SLS-Kernstufe", "64,6 m hohe Kernstufe mit vier RS-25."),
    "shuttle_et": ("Uzay Mekiği Dış Tankı", "Mekiğin üç RS-25 motorunu besler; yeniden kullanılmaz.", "Space-Shuttle-Außentank", "Versorgt die drei RS-25 des Orbiters und wird nicht wiederverwendet."),
    "atlas_v_cbb": ("Atlas V Ortak Çekirdek Kademe", "New Horizons, Curiosity ve Perseverance'ı fırlatan Atlas V'in çekirdeği.", "Atlas-V-Kernstufe (CCB)", "Kern der Atlas V, die New Horizons, Curiosity und Perseverance startete."),
    "delta_iv_cbc": ("Delta IV Ortak Çekirdek Kademe", "Orion EFT-1 ve Parker Güneş Sondası'nda kullanılan hidrojen çekirdek.", "Delta-IV-Kernstufe (CBC)", "Wasserstoffkern für Orion EFT-1 und die Parker Solar Probe."),
    "titan_ii_s1": ("Titan II Birinci Kademe", "Gemini fırlatıcısının hipergolik birinci kademesi.", "Titan-II-Erststufe", "Hypergole Erststufe der Gemini-Trägerrakete."),
    "redstone_tank": ("Redstone Tank Grubu", "Alan Shepard'ı Amerika'nın ilk insanlı uzay uçuşuna taşıdı.", "Redstone-Tankbaugruppe", "Brachte Alan Shepard auf Amerikas ersten bemannten Raumflug."),
    "f1": ("Rocketdyne F-1", "Şimdiye kadar uçmuş en güçlü tek yanma odalı sıvı yakıtlı motor.", "Rocketdyne F-1", "Stärkstes je geflogenes Flüssigtriebwerk mit nur einer Brennkammer."),
    "j2": ("Rocketdyne J-2", "Saturn üst kademelerinin yeniden ateşlenebilen hidrojen motoru.", "Rocketdyne J-2", "Wiederzündbares Wasserstofftriebwerk der Saturn-Oberstufen."),
    "rs25": ("Aerojet RS-25", "Uzay Mekiği ana motoru; SLS için yeniden uçuyor.", "Aerojet RS-25", "Haupttriebwerk des Space Shuttle, erneut genutzt für SLS."),
    "rl10": ("Aerojet RL10", "Vakum için optimize edilmiş hidrojen motoru. Deniz seviyesinde kalkış sağlayamaz.", "Aerojet RL10", "Vakuumoptimiertes Wasserstofftriebwerk. Kein Abheben auf Meereshöhe möglich."),
    "rd180": ("RD-180", "NASA bilim fırlatmalarında Atlas V'e güç veren çift odalı motor.", "RD-180", "Zweikammertriebwerk der Atlas V für NASA-Wissenschaftsstarts."),
    "rs68a": ("Aerojet RS-68A", "Uçtuğu dönemde hidrojen yakan en büyük motor.", "Aerojet RS-68A", "Zu seiner Zeit das größte wasserstoffbetriebene Triebwerk."),
    "lr87": ("Aerojet LR87", "Gemini'yi fırlatan çift odalı hipergolik motor.", "Aerojet LR87", "Hypergoles Zweikammertriebwerk, das Gemini startete."),
    "lr91": ("Aerojet LR91", "Titan II ikinci kademesinin hipergolik vakum motoru.", "Aerojet LR91", "Hypergoles Vakuumtriebwerk der Titan-II-Zweitstufe."),
    "a7": ("Rocketdyne A-7", "Mercury-Redstone roketinin motoru.", "Rocketdyne A-7", "Triebwerk der Mercury-Redstone."),
    "shuttle_srb": ("Mekik Katı Yakıtlı Yardımcı Roketi", "Çift olarak takılan, geri kazanılabilir dört segmentli yardımcı roket.", "Shuttle-Feststoffbooster", "Bergbarer Vier-Segment-Booster, paarweise montiert."),
    "sls_srb": ("SLS 5 Segmentli Katı Yardımcı Roket", "Şimdiye kadar uçmuş en güçlü katı yakıtlı yardımcı roketler.", "SLS-Fünfsegment-Booster", "Die stärksten je geflogenen Feststoffbooster."),
    "gem63": ("GEM 63 Yan Roket", "Atlas V için Northrop Grumman yan roketi.", "GEM-63-Booster", "Seitenbooster von Northrop Grumman für die Atlas V."),
    "delta_cbc_booster": ("Delta IV Heavy Yan Kademesi", "Kendi RS-68A motoru olan yan Ortak Çekirdek Kademe.", "Delta-IV-Heavy-Seitenbooster", "Seitlicher Kernbooster mit eigenem RS-68A."),
    "saturn_fins": ("Saturn V Kanatçık Seti (x4)", "Tırmanış sırasında S-IC'yi dengeleyen dört kanatçık.", "Saturn-V-Finnensatz (x4)", "Vier Finnen, die die S-IC beim Aufstieg stabilisieren."),
    "redstone_fins": ("Redstone Kanatçık Seti", "Yönlendirme için grafit kanatçıklı yüzgeçler.", "Redstone-Finnensatz", "Finnen mit Grafitrudern zur Steuerung."),
    "fairing_5m": ("5 m Faydalı Yük Burun Konisi", "Yükü atmosferden geçerken koruyan kompozit burun konisi.", "5-m-Nutzlastverkleidung", "Verbundverkleidung, die die Nutzlast beim Aufstieg schützt."),
    "fairing_3m": ("3 m Faydalı Yük Burun Konisi", "Bilim sondaları ve kargo için orta boy burun konisi.", "3-m-Nutzlastverkleidung", "Mittlere Verkleidung für Raumsonden und Fracht."),
    "skylab": ("Skylab Yörünge Atölyesi", "Son Saturn V ile fırlatılan, Amerika'nın ilk uzay istasyonu.", "Skylab-Orbitalwerkstatt", "Amerikas erste Raumstation, gestartet mit der letzten Saturn V."),
    "mariner2": ("Mariner 2 Sondası", "Başka bir gezegenin (Venüs) yanından geçen ilk uzay aracı.", "Mariner-2-Sonde", "Erste Raumsonde, die an einem anderen Planeten (Venus) vorbeiflog."),
    "voyager": ("Voyager Sondası + İtki Modülü", "Dış gezegenleri dolaşan ve şimdi yıldızlararası uzayda olan ikiz sondalar.", "Voyager-Sonde + Antriebsmodul", "Zwillingssonden, die die äußeren Planeten besuchten und nun im interstellaren Raum sind."),
    "cassini": ("Cassini-Huygens", "Titan'a inen Huygens modülünü taşıyan Satürn yörünge aracı.", "Cassini-Huygens", "Saturn-Orbiter mit dem Titan-Lander Huygens."),
    "mer_rover": ("Mars Keşif Gezgini + Seyir Kademesi", "Opportunity 90 sol için planlandı, yaklaşık 15 yıl yol aldı.", "Mars Exploration Rover + Marschstufe", "Opportunity war für 90 Sols geplant und fuhr fast 15 Jahre."),
    "europa_clipper": ("Europa Clipper", "Jüpiter'in uydusu Europa'ya giden en büyük NASA gezegen aracı.", "Europa Clipper", "Größte planetare NASA-Sonde, unterwegs zum Jupitermond Europa."),
    "cygnus": ("Cygnus Kargo Aracı", "ISS'e yük taşıyan insansız kargo aracı.", "Cygnus-Frachter", "Unbemannter Frachter für die ISS."),
    "agena": ("Agena Üst Kademe", "Ranger ve Mariner sondalarını yola çıkaran, yeniden ateşlenebilen kademe.", "Agena-Oberstufe", "Wiederzündbare Stufe, die Ranger- und Mariner-Sonden auf den Weg brachte."),
    "titan_iv_s2": ("Titan IV İkinci Kademe", "Titan IV'ün hipergolik ikinci kademesi.", "Titan-IV-Zweitstufe", "Hypergole Zweitstufe der Titan IV."),
    "delta_ii_s2": ("Delta II İkinci Kademe", "Yeniden ateşlenebilen hipergolik üst kademe.", "Delta-II-Zweitstufe", "Wiederzündbare hypergole Oberstufe."),
    "f9_s2": ("Falcon 9 İkinci Kademe", "NASA mürettebat ve kargo uçuşlarında kullanılan kerosen yakıtlı üst kademe.", "Falcon-9-Zweitstufe", "Kerosin-Oberstufe für NASA-Crew- und Frachtflüge."),
    "castor30xl": ("Castor 30XL Katı Üst Kademe", "Cygnus'u yörüngeye taşıyan katı yakıtlı üst kademe.", "Castor-30XL-Feststoffoberstufe", "Feststoffoberstufe, die Cygnus in den Orbit bringt."),
    "eus": ("Keşif Üst Kademesi (EUS)", "SLS Block 1B için planlanan dört RL10 motorlu üst kademe.", "Exploration Upper Stage (EUS)", "Geplante Oberstufe mit vier RL10 für SLS Block 1B."),
    "s_ib": ("S-IB Birinci Kademe", "Apollo 7 ve Skylab ekiplerini fırlatan kümelenmiş tanklı birinci kademe.", "S-IB-Erststufe", "Erststufe mit gebündelten Tanks; startete Apollo 7 und die Skylab-Crews."),
    "atlas_lv3": ("Atlas LV-3 Balon Tankı", "Basınçla ayakta duran, bozuk paradan ince çelik tank.", "Atlas-LV-3-Ballontank", "Druckstabilisierter Stahltank, dünner als eine Münze."),
    "titan_iv_s1": ("Titan IV Birinci Kademe", "Cassini'yi fırlatan uzatılmış Titan çekirdeği.", "Titan-IV-Erststufe", "Verlängerter Titan-Kern, der Cassini startete."),
    "delta_ii_s1": ("Delta II Thor-ELT Birinci Kademe", "Spirit, Opportunity, Kepler ve Phoenix'i fırlatan birinci kademe.", "Delta-II-Thor-ELT-Erststufe", "Erststufe, die Spirit, Opportunity, Kepler und Phoenix startete."),
    "f9_s1": ("Falcon 9 Birinci Kademe", "NASA ekiplerini ISS'e uçuran yeniden kullanılabilir kademe.", "Falcon-9-Erststufe", "Wiederverwendbare Stufe, die NASA-Crews zur ISS fliegt."),
    "antares_s1": ("Antares Birinci Kademe", "Cygnus kargo fırlatıcısının çekirdek kademesi.", "Antares-Erststufe", "Kernstufe der Cygnus-Trägerrakete."),
    "h1": ("Rocketdyne H-1", "S-IB'nin altında sekizli küme halinde kullanılır.", "Rocketdyne H-1", "Unter der S-IB zu acht gebündelt."),
    "ma5": ("Rocketdyne MA-5 Motor Seti", "İki yardımcı motor ve bir sürdürücü: Atlas'ın 'bir buçuk kademesi'.", "Rocketdyne-MA-5-Triebwerkssatz", "Zwei Booster und ein Marschtriebwerk: die 'anderthalb Stufen' der Atlas."),
    "bell8096": ("Bell 8096", "Agena'nın yeniden ateşlenebilen vakum motoru.", "Bell 8096", "Wiederzündbares Vakuumtriebwerk der Agena."),
    "rs27a": ("Rocketdyne RS-27A", "Delta II'nin ana motoru.", "Rocketdyne RS-27A", "Haupttriebwerk der Delta II."),
    "aj10": ("Aerojet AJ10-118K", "Apollo SPS motor ailesinin bir torunu.", "Aerojet AJ10-118K", "Nachfahre der Apollo-SPS-Triebwerksfamilie."),
    "merlin1d": ("SpaceX Merlin 1D", "Gücü ayarlanabilen motor; her çekirdekte dokuz adet.", "SpaceX Merlin 1D", "Drosselbares Triebwerk, neun pro Kernstufe."),
    "merlin_vac": ("SpaceX Merlin Vakum", "Büyük nozul uzantılı, vakum için optimize edilmiş Merlin.", "SpaceX Merlin Vacuum", "Vakuumoptimierter Merlin mit großer Düsenverlängerung."),
    "rd181": ("RD-181", "Tek odalı motor; her Antares'te iki adet.", "RD-181", "Einkammertriebwerk, zwei pro Antares."),
    "castor30_motor": ("Castor 30XL Nozulu", "Castor 30XL'in yönlendirilebilir nozulu.", "Castor-30XL-Düse", "Schwenkbare Düse des Castor 30XL."),
    "ua1205": ("UA1205 Katı Yardımcı Roket", "Voyager ve Viking'i fırlatan beş segmentli yardımcı roketler.", "UA1205-Feststoffbooster", "Fünf-Segment-Booster, die Voyager und Viking starteten."),
    "srmu": ("Titan IV SRMU", "Cassini'yi fırlatan grafit-epoksi katı yakıtlı yardımcı roketler.", "Titan-IV-SRMU", "Grafit-Epoxid-Feststoffbooster, die Cassini starteten."),
    "gem40": ("GEM 40 Yan Roket", "Bir Delta II'nin çevresine dokuz adede kadar takılır.", "GEM-40-Booster", "Bis zu neun Stück rund um eine Delta II."),
    "fh_side": ("Falcon Heavy Yan Kademesi", "Dokuz Merlin 1D motorlu, yeniden kullanılabilir yan çekirdek.", "Falcon-Heavy-Seitenbooster", "Wiederverwendbarer Seitenkern mit neun Merlin-1D."),
}

_PROGRAM = {
    "tr": [("Project Mercury", "Mercury Projesi"), ("Project Gemini", "Gemini Projesi"), ("NASA Commercial Crew", "NASA Ticari Mürettebat"),
           ("Space Shuttle", "Uzay Mekiği"), ("stage 2", "2. kademe"), ("Planned", "Planlanan")],
    "de": [("Project Mercury", "Projekt Mercury"), ("Project Gemini", "Projekt Gemini"), ("stage 2", "2. Stufe"), ("Planned", "Geplant")],
}


def part_name(pid: str, default: str, lang: str) -> str:
    row = PARTS.get(pid)
    return default if not row or lang == "en" else row[0] if lang == "tr" else row[2]


def localize_part(p: dict, lang: str) -> dict:
    row = PARTS.get(p["id"])
    if lang == "en" or not row:
        return p
    name, desc = (row[0], row[1]) if lang == "tr" else (row[2], row[3])
    return {**p, "name": name, "description": desc, "program": program(p["program"], lang)}


def program(s: str, lang: str) -> str:
    for a, b in _PROGRAM.get(lang, []):
        s = s.replace(a, b)
    return s
