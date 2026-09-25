import type { Localized } from "@/lib/types";

export type ArticleCategory = "developments" | "golden-visa" | "market" | "company";

export interface Article {
  slug: string;
  category: ArticleCategory;
  /** ISO date when known; null when the original publication date is not confirmed. */
  date: string | null;
  dateLabel: Localized;
  title: Localized;
  summary: Localized;
  body: { en: string[]; el: string[]; tr: string[] };
  sources?: Array<{ label: string; url: string }>;
  /** Legacy article whose full original text must be migrated from the live site. */
  legacySummaryOnly?: boolean;
  minutes: number;
}

export const articles: Article[] = [
  {
    slug: "greek-golden-visa-after-law-5100-2024",
    category: "golden-visa",
    date: "2026-09-25",
    dateLabel: { en: "25 September 2026", el: "25 Σεπτεμβρίου 2026", tr: "25 Eylül 2026" },
    minutes: 5,
    title: {
      en: "Greece's Golden Visa after Law 5100/2024: what changed for property buyers",
      el: "Η Golden Visa μετά τον Ν. 5100/2024: τι άλλαξε για τους αγοραστές ακινήτων",
      tr: "5100/2024 sayılı Kanun sonrası Golden Visa: gayrimenkul alıcıları için neler değişti",
    },
    summary: {
      en: "Three thresholds, a 120 m² rule, a single-property requirement and a ban on short-term letting. A plain summary for buyers.",
      el: "Τρία όρια, κανόνας 120 m², απαίτηση ενός ακινήτου και απαγόρευση βραχυχρόνιας μίσθωσης. Μια απλή σύνοψη για αγοραστές.",
      tr: "Üç eşik, 120 m² kuralı, tek mülk şartı ve kısa süreli kiralama yasağı. Alıcılar için sade bir özet.",
    },
    body: {
      en: [
        "For a decade, €250,000 was the headline figure of Greece's residence-by-investment programme. Law 5100/2024 replaced it with a tiered system in which the property's location and type decide the minimum.",
        "In Attica (which includes Athens and Piraeus), Thessaloniki, Mykonos, Santorini and islands with more than 3,100 residents, the minimum is €800,000. Everywhere else it is €400,000. In both cases the investment must be in a single property with at least 120 m² of main living space.",
        "A €250,000 route remains for two cases only: properties converted from commercial to residential use, and the restoration of listed buildings. The 120 m² minimum does not apply to them, but the conversion or restoration must be complete before the application is filed.",
        "Every route now carries a ban on short-term letting (under 60 days). Breaches can lead to a €50,000 fine and revocation of the permit. In April 2026 the Ministry of Migration issued Circular 1/2026, clarifying how the rules apply to mixed-use and off-plan purchases and what counts as a single property.",
        "What this means for buyers of compact Athens apartments: such homes can support a Golden Visa application only if the specific residence qualifies under the conversion route. That is a property-by-property legal question. Ask for the change-of-use permit and have your own lawyer confirm it.",
        "This article summarises published legal commentary as of September 2026. It is not legal advice, and rules may change.",
      ],
      el: [
        "Για μια δεκαετία, οι €250.000 ήταν το βασικό νούμερο του προγράμματος άδειας διαμονής μέσω επένδυσης. Ο Ν. 5100/2024 το αντικατέστησε με κλιμακωτό σύστημα, όπου η τοποθεσία και το είδος του ακινήτου ορίζουν το ελάχιστο.",
        "Στην Αττική (με την Αθήνα και τον Πειραιά), τη Θεσσαλονίκη, τη Μύκονο, τη Σαντορίνη και τα νησιά άνω των 3.100 κατοίκων, το ελάχιστο είναι €800.000. Αλλού είναι €400.000. Και στις δύο περιπτώσεις η επένδυση αφορά ένα ακίνητο με κύρια χρήση τουλάχιστον 120 m².",
        "Η διαδρομή των €250.000 παραμένει μόνο για δύο περιπτώσεις: ακίνητα που μετατράπηκαν από επαγγελματική σε οικιστική χρήση και αποκατάσταση διατηρητέων. Το ελάχιστο των 120 m² δεν ισχύει, αλλά η μετατροπή ή αποκατάσταση πρέπει να έχει ολοκληρωθεί πριν από την αίτηση.",
        "Σε όλες τις διαδρομές απαγορεύεται πλέον η βραχυχρόνια μίσθωση (κάτω των 60 ημερών), με πρόστιμο €50.000 και ανάκληση της άδειας. Τον Απρίλιο 2026 το Υπουργείο Μετανάστευσης εξέδωσε την Εγκύκλιο 1/2026 με διευκρινίσεις για μικτές χρήσεις, αγορές «στα χαρτιά» και την έννοια του ενός ακινήτου.",
        "Για αγοραστές συμπαγών διαμερισμάτων στην Αθήνα: τέτοιες κατοικίες στηρίζουν αίτηση Golden Visa μόνο αν η συγκεκριμένη κατοικία πληροί τη διαδρομή αλλαγής χρήσης. Είναι νομικό ζήτημα ανά ακίνητο. Ζητήστε την άδεια αλλαγής χρήσης και την επιβεβαίωση του δικηγόρου σας.",
        "Το άρθρο συνοψίζει δημοσιευμένη νομική ανάλυση έως τον Σεπτέμβριο 2026. Δεν αποτελεί νομική συμβουλή και οι κανόνες μπορεί να αλλάξουν.",
      ],
      tr: [
        "On yıl boyunca 250.000 €, Yunanistan'ın yatırım yoluyla oturum programının öne çıkan rakamıydı. 5100/2024 sayılı Kanun bunu, asgari tutarı mülkün konumu ve türünün belirlediği kademeli bir sistemle değiştirdi.",
        "Attika'da (Atina ve Pire dahil), Selanik'te, Mikonos'ta, Santorini'de ve nüfusu 3.100'ü aşan adalarda asgari tutar 800.000 €'dur. Diğer her yerde 400.000 €'dur. Her iki durumda da yatırım, ana yaşam alanı en az 120 m² olan tek bir mülke yapılmalıdır.",
        "250.000 € yolu yalnızca iki durum için kalmıştır: ticari kullanımdan konut kullanımına dönüştürülen mülkler ve tescilli binaların restorasyonu. 120 m² şartı bunlara uygulanmaz; ancak dönüşüm veya restorasyon başvurudan önce tamamlanmış olmalıdır.",
        "Artık tüm yollarda kısa süreli kiralama (60 günden kısa) yasaktır; ihlal 50.000 € para cezası ve iznin iptaline yol açabilir. Nisan 2026'da Göç Bakanlığı, karma kullanımlı ve projeden alımlar ile tek mülk kavramını açıklayan 1/2026 sayılı Genelge'yi yayımladı.",
        "Kompakt Atina dairesi alıcıları için anlamı: bu tür konutlar, ancak belirli konut dönüşüm yoluna uygunsa Golden Visa başvurusunu destekleyebilir. Bu, mülk bazında hukuki bir sorudur. Kullanım değişikliği iznini isteyin ve kendi avukatınıza teyit ettirin.",
        "Bu yazı, Eylül 2026 itibarıyla yayımlanmış hukuki yorumları özetler. Hukuki tavsiye değildir ve kurallar değişebilir.",
      ],
    },
    sources: [
      { label: "Watson Farley & Williams — Understanding the new Golden Visa Law No. 5100/2024", url: "https://www.wfw.com/articles/understanding-the-new-golden-visa-law-%CE%BD%CE%BF-5100-2024-key-points-and-implications/" },
      { label: "Investment Migration Council — Greek Golden Visa amendments & transition period", url: "https://investmentmigration.org/articles/greek-golden-visa-programme-amendments-transition-period-the-refined-guidelines/" },
      { label: "Varnavas Law — New circular issued with key clarifications (2026)", url: "https://varnavas.gr/newsroom/post/breaking-new-greek-golden-visa-circular-issued-with-key-clarifications-and-practical-examples-what-every-investor-needs-to-know-in-2026/" },
      { label: "IMI Daily — Greece cracks down on Golden Visa fraud in sprawling new circular", url: "https://www.imidaily.com/europe/greece-cracks-down-on-golden-visa-fraud-in-sprawling-new-circular/" },
    ],
  },
  {
    slug: "buying-property-in-greece-from-abroad",
    category: "market",
    date: "2026-09-24",
    dateLabel: { en: "24 September 2026", el: "24 Σεπτεμβρίου 2026", tr: "24 Eylül 2026" },
    minutes: 4,
    title: {
      en: "Buying a home in Greece from abroad: the process, step by step",
      el: "Αγορά κατοικίας στην Ελλάδα από το εξωτερικό: η διαδικασία βήμα βήμα",
      tr: "Yurt dışından Yunanistan'da ev satın almak: adım adım süreç",
    },
    summary: {
      en: "Tax number, bank account, lawyer, notary, registration. What an international buyer should expect, in order.",
      el: "ΑΦΜ, τραπεζικός λογαριασμός, δικηγόρος, συμβολαιογράφος, μεταγραφή. Τι να περιμένει ένας διεθνής αγοραστής, με τη σειρά.",
      tr: "Vergi numarası, banka hesabı, avukat, noter, tescil. Uluslararası bir alıcının sırasıyla bilmesi gerekenler.",
    },
    body: {
      en: [
        "Many of our buyers are purchasing in Greece for the first time, often from Beirut, Istanbul, Cairo, Dubai or London. The process is well established and can be handled largely at a distance with a power of attorney.",
        "First, obtain a Greek tax number (AFM) and open a Greek bank account. Both are needed to pay for a property and to register it.",
        "Second, appoint an independent Greek lawyer. They check title, permits and encumbrances and, for new buildings, the building permit and construction status. For Golden Visa purchases they also confirm which route the specific property qualifies for.",
        "Third, reserve the residence. A reservation agreement and deposit take it off the market while due diligence completes.",
        "Fourth, sign the purchase contract before a notary. The contract is then registered with the land registry or cadastre, which makes you the registered owner.",
        "For off-plan purchases, payments are typically staged against construction progress. Ask for the payment schedule and the expected completion date in writing.",
      ],
      el: [
        "Πολλοί από τους αγοραστές μας αγοράζουν στην Ελλάδα για πρώτη φορά, συχνά από Βηρυτό, Κωνσταντινούπολη, Κάιρο, Ντουμπάι ή Λονδίνο. Η διαδικασία είναι καθιερωμένη και μπορεί να γίνει σε μεγάλο βαθμό από απόσταση με πληρεξούσιο.",
        "Πρώτα, έκδοση ελληνικού ΑΦΜ και άνοιγμα ελληνικού τραπεζικού λογαριασμού. Χρειάζονται και τα δύο για την πληρωμή και τη μεταγραφή.",
        "Δεύτερον, ορισμός ανεξάρτητου Έλληνα δικηγόρου, που ελέγχει τίτλους, άδειες και βάρη και, για νέα κτίρια, την οικοδομική άδεια και την πρόοδο κατασκευής. Για αγορές Golden Visa επιβεβαιώνει και τη διαδρομή που πληροί το συγκεκριμένο ακίνητο.",
        "Τρίτον, κράτηση της κατοικίας. Συμφωνητικό κράτησης και προκαταβολή την αποσύρουν από την αγορά όσο ολοκληρώνεται ο έλεγχος.",
        "Τέταρτον, υπογραφή του συμβολαίου ενώπιον συμβολαιογράφου. Το συμβόλαιο καταχωρίζεται στο υποθηκοφυλακείο ή το κτηματολόγιο και γίνεστε ο εγγεγραμμένος ιδιοκτήτης.",
        "Σε αγορές «στα χαρτιά», οι πληρωμές γίνονται συνήθως σε δόσεις ανάλογα με την πρόοδο κατασκευής. Ζητήστε γραπτώς το πρόγραμμα πληρωμών και την εκτιμώμενη ημερομηνία παράδοσης.",
      ],
      tr: [
        "Alıcılarımızın çoğu Yunanistan'da ilk kez, genellikle Beyrut, İstanbul, Kahire, Dubai veya Londra'dan satın alıyor. Süreç oturmuştur ve vekaletname ile büyük ölçüde uzaktan yürütülebilir.",
        "Önce Yunan vergi numarası (AFM) alın ve Yunan banka hesabı açın. Ödeme ve tescil için ikisi de gerekir.",
        "İkinci olarak bağımsız bir Yunan avukat atayın. Avukat tapuyu, izinleri ve takyidatları; yeni binalarda yapı ruhsatını ve inşaat durumunu kontrol eder. Golden Visa alımlarında belirli mülkün hangi yola uygun olduğunu da teyit eder.",
        "Üçüncü olarak konutu rezerve edin. Rezervasyon sözleşmesi ve kapora, inceleme tamamlanırken konutu piyasadan çeker.",
        "Dördüncü olarak satış sözleşmesini noter huzurunda imzalayın. Sözleşme tapu sicili veya kadastroya tescil edilir ve kayıtlı malik olursunuz.",
        "Projeden alımlarda ödemeler genellikle inşaat ilerlemesine göre kademelendirilir. Ödeme planını ve tahmini teslim tarihini yazılı olarak isteyin.",
      ],
    },
  },
  {
    slug: "terrace-heights-wins-luxury-lifestyle-awards-2026-for-best-luxury-apartment-living-in-greece",
    category: "developments",
    date: null,
    dateLabel: { en: "2026", el: "2026", tr: "2026" },
    minutes: 2,
    legacySummaryOnly: true,
    title: {
      en: "Terrace Heights wins Luxury Lifestyle Awards 2026 for Best Luxury Apartment Living in Greece",
      el: "Το Terrace Heights κέρδισε στα Luxury Lifestyle Awards 2026 (Best Luxury Apartment Living in Greece)",
      tr: "Terrace Heights, Luxury Lifestyle Awards 2026'da Best Luxury Apartment Living in Greece ödülünü kazandı",
    },
    summary: {
      en: "Limar Homes reports that Terrace Heights in Peristeri has been recognised by the Luxury Lifestyle Awards 2026.",
      el: "Η Limar Homes ανακοινώνει ότι το Terrace Heights στο Περιστέρι διακρίθηκε στα Luxury Lifestyle Awards 2026.",
      tr: "Limar Homes, Peristeri'deki Terrace Heights'ın Luxury Lifestyle Awards 2026'da ödül aldığını duyurdu.",
    },
    body: {
      en: [
        "Limar Homes announced that Terrace Heights, its residential development in Peristeri, Athens, has received the Luxury Lifestyle Awards 2026 title for Best Luxury Apartment Living in Greece.",
        "According to Limar, the recognition relates to the project's design, amenities and residential experience. Terrace Heights is Limar's current development, with completion estimated for 2027.",
      ],
      el: [
        "Η Limar Homes ανακοίνωσε ότι το Terrace Heights, το οικιστικό της έργο στο Περιστέρι, απέσπασε τη διάκριση Best Luxury Apartment Living in Greece στα Luxury Lifestyle Awards 2026.",
        "Σύμφωνα με τη Limar, η διάκριση αφορά τον σχεδιασμό, τις παροχές και την εμπειρία κατοίκησης του έργου. Το Terrace Heights είναι το τρέχον έργο της Limar, με εκτιμώμενη παράδοση το 2027.",
      ],
      tr: [
        "Limar Homes, Atina Peristeri'deki konut projesi Terrace Heights'ın Luxury Lifestyle Awards 2026'da Best Luxury Apartment Living in Greece unvanını aldığını duyurdu.",
        "Limar'a göre ödül, projenin tasarımı, olanakları ve yaşam deneyimiyle ilgilidir. Terrace Heights, tahmini teslimi 2027 olan güncel Limar projesidir.",
      ],
    },
  },
  {
    slug: "limar-homes-2025-review-a-visionary-year-in-property",
    category: "company",
    date: "2025-12-15",
    dateLabel: { en: "December 2025", el: "Δεκέμβριος 2025", tr: "Aralık 2025" },
    minutes: 2,
    legacySummaryOnly: true,
    title: {
      en: "Limar Homes 2025 review: a visionary year in property development and growth",
      el: "Απολογισμός 2025 της Limar Homes: μια χρονιά ανάπτυξης",
      tr: "Limar Homes 2025 değerlendirmesi: gayrimenkul geliştirmede bir büyüme yılı",
    },
    summary: {
      en: "Limar's look back at 2025, including the launch of Parkview Residences in Kallithea.",
      el: "Η Limar κοιτάζει πίσω στο 2025, με την παρουσίαση του Parkview Residences στην Καλλιθέα.",
      tr: "Limar'ın 2025'e bakışı; Kallithea'daki Parkview Residences lansmanı dahil.",
    },
    body: {
      en: [
        "In December 2025 Limar Homes published a review of its year. Among the milestones was the November 2025 launch of Parkview Residences, thirteen residences in Kallithea, since sold out.",
      ],
      el: [
        "Τον Δεκέμβριο 2025 η Limar Homes δημοσίευσε τον απολογισμό της χρονιάς. Ανάμεσα στα ορόσημα ήταν η παρουσίαση του Parkview Residences τον Νοέμβριο 2025, δεκατρείς κατοικίες στην Καλλιθέα που έχουν πλέον πωληθεί.",
      ],
      tr: [
        "Aralık 2025'te Limar Homes yılın değerlendirmesini yayımladı. Önemli adımlar arasında, Kasım 2025'te lansmanı yapılan ve şu anda tamamı satılmış olan Kallithea'daki on üç konutluk Parkview Residences vardı.",
      ],
    },
  },
];

export function getArticle(slug: string) {
  return articles.find((a) => a.slug === slug);
}
