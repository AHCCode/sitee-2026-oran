import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normalizeText } from "../src/lib/text";

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: "menuiserie", nameFr: "Menuiserie & Ébénisterie", nameEn: "Carpentry & Cabinetmaking", icon: "hammer" },
  { slug: "couture", nameFr: "Couture & Stylisme", nameEn: "Tailoring & Fashion Design", icon: "scissors" },
  { slug: "maconnerie", nameFr: "Maçonnerie & Gros œuvre", nameEn: "Masonry & Construction", icon: "building" },
  { slug: "electricite", nameFr: "Électricité & Solaire", nameEn: "Electrical & Solar Installation", icon: "zap" },
  { slug: "plomberie", nameFr: "Plomberie & Sanitaire", nameEn: "Plumbing & Sanitary", icon: "wrench" },
  { slug: "coiffure", nameFr: "Coiffure & Tresses", nameEn: "Hairdressing & Braiding", icon: "sparkles" },
  { slug: "bijouterie", nameFr: "Bijouterie & Orfèvrerie", nameEn: "Jewelry & Goldsmithing", icon: "gem" },
  { slug: "poterie", nameFr: "Poterie & Céramique", nameEn: "Pottery & Ceramics", icon: "amphora" },
  { slug: "tissage", nameFr: "Tissage & Textile traditionnel", nameEn: "Weaving & Traditional Textiles", icon: "layers" },
  { slug: "maroquinerie", nameFr: "Maroquinerie & Cuir", nameEn: "Leatherwork & Saddlery", icon: "briefcase" },
  { slug: "ferronnerie", nameFr: "Ferronnerie & Soudure", nameEn: "Ironwork & Welding", icon: "flame" },
  { slug: "peinture", nameFr: "Peinture & Décoration", nameEn: "Painting & Interior Finish", icon: "paintbrush" },
] as const;

const COUNTRIES = [
  {
    code: "SN",
    nameFr: "Sénégal",
    nameEn: "Senegal",
    cities: ["Dakar", "Thiès", "Saint-Louis", "Ziguinchor"],
  },
  {
    code: "CI",
    nameFr: "Côte d'Ivoire",
    nameEn: "Ivory Coast",
    cities: ["Abidjan", "Bouaké", "Yamoussoukro", "San-Pédro"],
  },
  {
    code: "TN",
    nameFr: "Tunisie",
    nameEn: "Tunisia",
    cities: ["Tunis", "Sfax", "Sousse", "Kairouan"],
  },
  {
    code: "DZ",
    nameFr: "Algérie",
    nameEn: "Algeria",
    cities: ["Alger", "Oran", "Constantine", "Tlemcen"],
  },
  {
    code: "CM",
    nameFr: "Cameroun",
    nameEn: "Cameroon",
    cities: ["Douala", "Yaoundé", "Bafoussam", "Garoua"],
  },
  {
    code: "GH",
    nameFr: "Ghana",
    nameEn: "Ghana",
    cities: ["Accra", "Kumasi", "Tamale", "Takoradi"],
  },
  {
    code: "NG",
    nameFr: "Nigeria",
    nameEn: "Nigeria",
    cities: ["Lagos", "Abuja", "Ibadan", "Kano"],
  },
  {
    code: "KE",
    nameFr: "Kenya",
    nameEn: "Kenya",
    cities: ["Nairobi", "Mombasa", "Kisumu", "Nakuru"],
  },
  {
    code: "ML",
    nameFr: "Mali",
    nameEn: "Mali",
    cities: ["Bamako", "Ségou", "Sikasso", "Mopti"],
  },
  {
    code: "BJ",
    nameFr: "Bénin",
    nameEn: "Benin",
    cities: ["Cotonou", "Porto-Novo", "Parakou", "Abomey"],
  },
] as const;

type SeedArtisan = {
  id: string;
  fullName: string;
  businessName: string;
  categorySlug: string;
  countryCode: string;
  cityName: string;
  phone: string;
  email: string;
  website?: string;
  bio: string;
  yearsExperience: number;
  featured: boolean;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  services: string[];
  photos: { url: string; caption: string }[];
  daysAgo: number;
};

const ARTISANS: SeedArtisan[] = [
  {
    id: "art-ibrahima-ndiaye",
    fullName: "Ibrahima Ndiaye",
    businessName: "Atelier Bois Noble Médina",
    categorySlug: "menuiserie",
    countryCode: "SN",
    cityName: "Dakar",
    phone: "+221 77 412 89 30",
    email: "ibrahima.ndiaye@boisnoble.sn",
    website: "https://boisnoble-dakar.sn",
    bio: "Maître ébéniste à la Médina de Dakar depuis plus de 18 ans, Ibrahima Ndiaye conçoit et réalise du mobilier sur mesure en bois de teck, acajou et dimb. Son atelier accompagne particuliers, hôtels et architectes d'intérieur pour des pièces durables aux finitions soignées.",
    yearsExperience: 18,
    featured: true,
    status: "PUBLISHED",
    services: [
      "Mobilier sur mesure en bois massif",
      "Tables à manger et buffets sculptés",
      "Portes d'entrée et boiseries architecturales",
      "Agencement de boutiques et restaurants",
      "Restauration de meubles anciens",
    ],
    photos: [
      { url: "/images/seed/menuiserie-1.jpg", caption: "Rabotage d'un plateau en bois massif à l'atelier de Dakar" },
      { url: "/images/seed/menuiserie-2.jpg", caption: "Buffet sculpté à la main en acajou du Sénégal" },
    ],
    daysAgo: 180,
  },
  {
    id: "art-awa-kone",
    fullName: "Awa Koné",
    businessName: "Maison Awa Couture & Wax",
    categorySlug: "couture",
    countryCode: "CI",
    cityName: "Abidjan",
    phone: "+225 07 58 21 44 19",
    email: "contact@maison-awa.ci",
    website: "https://maison-awa.ci",
    bio: "Styliste et couturière installée à Cocody (Abidjan), Awa Koné marie les coupes contemporaines aux étoffes africaines traditionnelles : pagne tissé Baoulé, wax hollandais, basin riche et dentelle. Tenues de cérémonie, costumes sur mesure et collections capsules.",
    yearsExperience: 14,
    featured: true,
    status: "PUBLISHED",
    services: [
      "Robes de cérémonie et mariages sur mesure",
      "Costumes et ensembles en pagne tissé",
      "Création de collections capsules",
      "Broderie traditionnelle et perlage",
      "Retouches haute couture",
    ],
    photos: [
      { url: "/images/seed/couture-1.jpg", caption: "Confection sur mesure à l'atelier de Cocody" },
      { url: "/images/seed/couture-2.jpg", caption: "Collection en wax et pagne tissé prête à livrer" },
    ],
    daysAgo: 165,
  },
  {
    id: "art-youssef-benali",
    fullName: "Youssef Benali",
    businessName: "Dar El Cuir Tlemcen",
    categorySlug: "maroquinerie",
    countryCode: "DZ",
    cityName: "Tlemcen",
    phone: "+213 551 34 82 10",
    email: "youssef@darelcuir.dz",
    website: "https://darelcuir.dz",
    bio: "Artisan maroquinier et sellier à Tlemcen, Youssef Benali travaille le cuir pleine fleur au tannage végétal. Sacs de voyage, cartables cousus sellier, poufs brodés et accessoires sur commande pour particuliers et boutiques.",
    yearsExperience: 22,
    featured: true,
    status: "PUBLISHED",
    services: [
      "Sacs et bagages en cuir pleine fleur",
      "Couture sellier à la main",
      "Poufs traditionnels et coussins en cuir",
      "Sandales et articles de sellerie artisanale",
      "Marquage et personnalisation sur cuir",
    ],
    photos: [
      { url: "/images/seed/maroquinerie-1.jpg", caption: "Travail du cuir tanné végétal à Tlemcen" },
      { url: "/images/seed/maroquinerie-2.jpg", caption: "Finitions sur mesure à l'établi" },
    ],
    daysAgo: 155,
  },
  {
    id: "art-karim-boudiaf",
    fullName: "Karim Boudiaf",
    businessName: "Atlas Solaire & Élec Oran",
    categorySlug: "electricite",
    countryCode: "DZ",
    cityName: "Oran",
    phone: "+213 550 74 19 82",
    email: "k.boudiaf@atlassolaire.dz",
    website: "https://atlassolaire.dz",
    bio: "Électricien certifié basé à Oran, Karim Boudiaf réalise des installations électriques complètes aux normes ainsi que des systèmes photovoltaïques hybrides pour villas, commerces et exploitations agricoles dans toute l'Oranie.",
    yearsExperience: 15,
    featured: true,
    status: "PUBLISHED",
    services: [
      "Installation électrique complète neuf et rénovation",
      "Tableaux électriques et mise aux normes",
      "Panneaux solaires photovoltaïques et onduleurs",
      "Éclairage architectural LED basse consommation",
      "Dépannage et maintenance préventive",
    ],
    photos: [
      { url: "/images/seed/electricite-1.jpg", caption: "Câblage d'un tableau de distribution industriel à Oran" },
      { url: "/images/seed/electricite-2.jpg", caption: "Raccordement sécurisé et contrôle des circuits" },
    ],
    daysAgo: 148,
  },
  {
    id: "art-kwame-mensah",
    fullName: "Kwame Mensah",
    businessName: "Bonwire Kente Heritage Loom",
    categorySlug: "tissage",
    countryCode: "GH",
    cityName: "Kumasi",
    phone: "+233 24 419 88 61",
    email: "kwame@bonwirekente.gh",
    bio: "Maître tisserand à Kumasi, Kwame Mensah perpétue l'art royal du tissage Kente ashanti sur métier traditionnel. Chaque bande est tissée à la main en coton et soie, avec des motifs géométriques porteurs de proverbes akan.",
    yearsExperience: 24,
    featured: true,
    status: "PUBLISHED",
    services: [
      "Tissage Kente authentique sur commande",
      "Étoffes de mariage et cérémonies royales",
      "Écharpes et étoles personnalisées",
      "Tissus d'ameublement tissés main",
    ],
    photos: [
      { url: "/images/seed/tissage-1.jpg", caption: "Étoffes colorées exposées à l'atelier de Kumasi" },
      { url: "/images/seed/tissage-2.jpg", caption: "Motifs traditionnels tissés à la main" },
    ],
    daysAgo: 140,
  },
  {
    id: "art-aminata-traore",
    fullName: "Aminata Traoré",
    businessName: "Terres du Fleuve Ségou",
    categorySlug: "poterie",
    countryCode: "ML",
    cityName: "Ségou",
    phone: "+223 76 42 18 90",
    email: "aminata@terresdufleuve.ml",
    bio: "Céramiste et potière à Ségou sur les rives du fleuve Niger, Aminata Traoré façonne des jarres, luminaires ajourés, vaisselle et vases en terre cuite engobée. Elle dirige une coopérative de 12 femmes potières.",
    yearsExperience: 19,
    featured: true,
    status: "PUBLISHED",
    services: [
      "Poterie traditionnelle en terre cuite de Ségou",
      "Vases et jarres décoratives grand format",
      "Vaisselle artisanale pour hôtels et restaurants",
      "Luminaires et appliques en céramique ajourée",
    ],
    photos: [
      { url: "/images/seed/poterie-1.jpg", caption: "Tournage et façonnage de l'argile à Ségou" },
      { url: "/images/seed/poterie-2.jpg", caption: "Collection de poteries en terre cuite séchant au soleil" },
    ],
    daysAgo: 132,
  },
  {
    id: "art-jean-paul-mbarga",
    fullName: "Jean-Paul Mbarga",
    businessName: "Bâtisseurs du Wouri",
    categorySlug: "maconnerie",
    countryCode: "CM",
    cityName: "Douala",
    phone: "+237 6 99 45 12 73",
    email: "jp.mbarga@batisseurswouri.cm",
    bio: "Chef maçon à Douala avec 16 ans de chantier, Jean-Paul Mbarga pilote des projets de construction résidentielle, d'extension, d'élévation de murs en parpaings vibrés et de dallages béton armé dans le Littoral.",
    yearsExperience: 16,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Gros œuvre et élévation de murs",
      "Fondations et dalles en béton armé",
      "Enduits de façade et chapes lissées",
      "Clôtures maçonnées et pavage extérieur",
    ],
    photos: [
      { url: "/images/seed/maconnerie-1.jpg", caption: "Élévation de mur au niveau à bulle sur chantier à Douala" },
      { url: "/images/seed/maconnerie-2.jpg", caption: "Pose soignée des blocs et contrôle d'alignement" },
    ],
    daysAgo: 120,
  },
  {
    id: "art-fatou-diop",
    fullName: "Fatou Diop",
    businessName: "Salon Reine du Cayor",
    categorySlug: "coiffure",
    countryCode: "SN",
    cityName: "Thiès",
    phone: "+221 78 301 55 12",
    email: "fatou.diop@reineducayor.sn",
    bio: "Spécialiste des coiffures protectrices et tresses artistiques à Thiès, Fatou Diop réalise nattes collées, box braids, fulani braids et coiffures de mariée avec des soins capillaires naturels au beurre de karité et huile de baobab.",
    yearsExperience: 11,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Tresses africaines (Box braids, Fulani, Knotless)",
      "Coiffures de mariée et cérémonies",
      "Soins capillaires naturels karité & hibiscus",
      "Entretien de locks et vanilles",
    ],
    photos: [
      { url: "/images/seed/coiffure-1.jpg", caption: "Réalisation de tresses au salon de Thiès" },
      { url: "/images/seed/coiffure-2.jpg", caption: "Finition précise de nattes et box braids" },
    ],
    daysAgo: 115,
  },
  {
    id: "art-chinedu-okafor",
    fullName: "Chinedu Okafor",
    businessName: "Eko AquaFlow Plumbing",
    categorySlug: "plomberie",
    countryCode: "NG",
    cityName: "Lagos",
    phone: "+234 803 614 9201",
    email: "chinedu@ekoaquaflow.ng",
    bio: "Master plumber serving Lekki, Victoria Island and Ikeja in Lagos. Chinedu Okafor handles complete bathroom installations, copper and PPR piping, water pressure booster systems, and solar water heaters.",
    yearsExperience: 13,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Complete bathroom & kitchen plumbing",
      "Borehole filtration & booster pump installation",
      "Solar and electric water heaters",
      "Leak detection & emergency pipe repair",
    ],
    photos: [
      { url: "/images/seed/plomberie-1.jpg", caption: "Installation de tuyauterie cuivre sous évier à Lagos" },
      { url: "/images/seed/plomberie-2.jpg", caption: "Serrage de précision sur raccord sanitaire" },
    ],
    daysAgo: 108,
  },
  {
    id: "art-khadija-alami",
    fullName: "Meriem Bencherif",
    businessName: "Orfèvrerie Cirta & Constantine",
    categorySlug: "bijouterie",
    countryCode: "DZ",
    cityName: "Constantine",
    phone: "+213 557 98 11 45",
    email: "meriem@orfevrerie-cirta.dz",
    bio: "Créatrice joaillière à Constantine, Meriem Bencherif façonne des bijoux en argent 925 ciselé, corail et filigrane traditionnel. Elle réalise des parures sur mesure et des pièces contemporaines inspirées du patrimoine algérien.",
    yearsExperience: 17,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Bijoux en argent 925 ciselé et corail",
      "Parures de mariage traditionnelles et modernes",
      "Sertissage de pierres semi-précieuses",
      "Restauration et polissage de bijoux anciens",
    ],
    photos: [
      { url: "/images/seed/bijouterie-1.jpg", caption: "Façonnage artisanal à l'atelier de Constantine" },
      { url: "/images/seed/bijouterie-2.jpg", caption: "Gravure et ciselure de précision" },
    ],
    daysAgo: 100,
  },
  {
    id: "art-koffi-ahouansou",
    fullName: "Koffi Ahouansou",
    businessName: "Forge Royale d'Abomey",
    categorySlug: "ferronnerie",
    countryCode: "BJ",
    cityName: "Cotonou",
    phone: "+229 97 31 64 20",
    email: "koffi@forgeroyale.bj",
    bio: "Ferronnier d'art et soudeur métallier à Cotonou, Koffi Ahouansou fabrique des portails en fer forgé, garde-corps d'escalier, pergolas bioclimatiques et grilles décoratives traitées anti-corrosion pour le climat côtier.",
    yearsExperience: 15,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Portails battants et coulissants en fer forgé",
      "Garde-corps et rampes d'escalier sur mesure",
      "Charpente métallique et pergolas",
      "Traitement antirouille et thermolaquage",
    ],
    photos: [
      { url: "/images/seed/ferronnerie-1.jpg", caption: "Travaux de métallerie et contrôle à Cotonou" },
      { url: "/images/seed/ferronnerie-2.jpg", caption: "Ajustement et assemblage en atelier" },
    ],
    daysAgo: 95,
  },
  {
    id: "art-grace-wanjiku",
    fullName: "Grace Wanjiku",
    businessName: "Nairobi Timber & Craft Studio",
    categorySlug: "menuiserie",
    countryCode: "KE",
    cityName: "Nairobi",
    phone: "+254 722 839 104",
    email: "grace@nairobitimber.co.ke",
    website: "https://nairobitimber.co.ke",
    bio: "Furniture maker and interior joiner in Karen, Nairobi. Grace Wanjiku crafts sustainable hardwood dining tables, office cabinetry, acoustic wall panels, and custom kitchen islands for homes and lodges across Kenya.",
    yearsExperience: 12,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Bespoke hardwood tables & seating",
      "Custom kitchen cabinets & wardrobes",
      "Lodge & hospitality furniture packages",
      "Wood finishing & natural oil treatment",
    ],
    photos: [
      { url: "/images/seed/menuiserie-2.jpg", caption: "Meuble sculpté en bois dur au studio de Nairobi" },
      { url: "/images/seed/menuiserie-1.jpg", caption: "Préparation des plateaux en atelier" },
    ],
    daysAgo: 88,
  },
  {
    id: "art-sofiane-merabet",
    fullName: "Sofiane Merabet",
    businessName: "Couleurs d'El Bahia",
    categorySlug: "peinture",
    countryCode: "DZ",
    cityName: "Alger",
    phone: "+213 558 19 43 70",
    email: "sofiane@couleursbahia.dz",
    bio: "Artisan peintre-décorateur opérant à Alger et Oran, Sofiane Merabet maîtrise les enduits décoratifs (tadelakt, stuc marbré), la peinture intérieure haute finition et le ravalement imperméable des façades méditerranéennes.",
    yearsExperience: 14,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Peinture intérieure mate, velours et satinée",
      "Enduits décoratifs tadelakt et stuc vénitien",
      "Ravalement et traitement hydrofuge de façade",
      "Pose de papier peint panoramique et moulures",
    ],
    photos: [
      { url: "/images/seed/peinture-1.jpg", caption: "Préparation des supports et maçonnerie fine" },
      { url: "/images/seed/peinture-2.jpg", caption: "Palette de couleurs et harmonies décoratives" },
    ],
    daysAgo: 82,
  },
  {
    id: "art-moussa-coulibaly",
    fullName: "Moussa Coulibaly",
    businessName: "Solaire & Courant Fort Bamako",
    categorySlug: "electricite",
    countryCode: "ML",
    cityName: "Bamako",
    phone: "+223 79 14 62 05",
    email: "moussa@solairebamako.ml",
    bio: "Technicien électricien à Bamako spécialisé dans l'autonomie énergétique solaire avec batteries lithium et la sécurisation des réseaux électriques domestiques et tertiaires.",
    yearsExperience: 10,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Kits solaires autonomes avec stockage lithium",
      "Pompage solaire pour forage et irrigation",
      "Câblage résidentiel et mise à la terre",
      "Protection contre les surtensions",
    ],
    photos: [
      { url: "/images/seed/electricite-2.jpg", caption: "Câblage de précision sur chantier à Bamako" },
      { url: "/images/seed/electricite-1.jpg", caption: "Inspection d'armoire électrique" },
    ],
    daysAgo: 76,
  },
  {
    id: "art-adjoa-owusu",
    fullName: "Adjoa Owusu",
    businessName: "Osu AfroChic Atelier",
    categorySlug: "couture",
    countryCode: "GH",
    cityName: "Accra",
    phone: "+233 20 731 45 92",
    email: "adjoa@afrochic-accra.gh",
    bio: "Fashion designer in Osu, Accra creating contemporary Kente and Ankara bridal gowns, tailored kaftans, and corporate African wear with impeccable fit and international shipping.",
    yearsExperience: 9,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Kente bridal & engagement gowns",
      "Bespoke men's kaftans & agbada",
      "Modern African corporate wear",
      "Group & wedding party outfitting",
    ],
    photos: [
      { url: "/images/seed/couture-2.jpg", caption: "Créations exposées au showroom d'Osu à Accra" },
      { url: "/images/seed/couture-1.jpg", caption: "Assemblage et piqûre en atelier" },
    ],
    daysAgo: 70,
  },
  {
    id: "art-rachid-tazi",
    fullName: "Walid Trabelsi",
    businessName: "Maîtres Bâtisseurs Carthage",
    categorySlug: "maconnerie",
    countryCode: "TN",
    cityName: "Tunis",
    phone: "+216 22 80 27 14",
    email: "walid.trabelsi@carthage-bat.tn",
    bio: "Entrepreneur maçon à Tunis spécialisé dans la rénovation de villas, l'extension de terrasses, la pose de faïence traditionnelle et le béton ciré.",
    yearsExperience: 20,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Rénovation complète de villas et appartements",
      "Pose de faïence traditionnelle et carreaux de ciment",
      "Création d'ouvertures et murs porteurs",
      "Étanchéité de toitures-terrasses",
    ],
    photos: [
      { url: "/images/seed/maconnerie-1.jpg", caption: "Chantier de construction et contrôle de niveau" },
      { url: "/images/seed/maconnerie-2.jpg", caption: "Maçonnerie de précision à Tunis" },
    ],
    daysAgo: 64,
  },
  {
    id: "art-clarisse-ngono",
    fullName: "Clarisse Ngono",
    businessName: "Bastos Beauty & Braids",
    categorySlug: "coiffure",
    countryCode: "CM",
    cityName: "Yaoundé",
    phone: "+237 6 77 82 40 18",
    email: "clarisse@bastosbraids.cm",
    bio: "Coiffeuse visagiste au quartier Bastos à Yaoundé, Clarisse Ngono propose des tresses sans douleur, coiffures de gala et rituels de soin pour cheveux crépus et bouclés.",
    yearsExperience: 8,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Knotless braids et cornrows graphiques",
      "Chignons et coiffures de cérémonie",
      "Diagnostic et soins hydratants profonds",
      "Prestation à domicile sur rendez-vous",
    ],
    photos: [
      { url: "/images/seed/coiffure-2.jpg", caption: "Tressage graphique réalisé à Yaoundé" },
      { url: "/images/seed/coiffure-1.jpg", caption: "Accueil en salon lumineux à Bastos" },
    ],
    daysAgo: 58,
  },
  {
    id: "art-bakary-touray",
    fullName: "Bakary Sanogo",
    businessName: "Sanitaire Pro Marcory",
    categorySlug: "plomberie",
    countryCode: "CI",
    cityName: "Abidjan",
    phone: "+225 05 44 90 12 63",
    email: "bakary@sanitairepro.ci",
    bio: "Plombier chauffagiste à Abidjan (Marcory & Zone 4), Bakary Sanogo intervient pour la création de salles de bain modernes, la pose de surpresseurs et la recherche de fuites sans casse.",
    yearsExperience: 12,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Création et rénovation de salles de bain",
      "Installation de chauffe-eau et surpresseurs",
      "Réseaux multicouche, PPR et cuivre",
      "Dépannage fuite d'eau 7j/7",
    ],
    photos: [
      { url: "/images/seed/plomberie-1.jpg", caption: "Raccordement sanitaire sous plan à Abidjan" },
      { url: "/images/seed/plomberie-2.jpg", caption: "Finition sur tuyauterie cuivre" },
    ],
    daysAgo: 52,
  },
  {
    id: "art-cheikh-fall",
    fullName: "Cheikh Tidiane Fall",
    businessName: "Filigrane de Saint-Louis",
    categorySlug: "bijouterie",
    countryCode: "SN",
    cityName: "Saint-Louis",
    phone: "+221 77 654 20 81",
    email: "cheikh.fall@filigrane-ndar.sn",
    bio: "Maître bijoutier à Saint-Louis du Sénégal, Cheikh Tidiane Fall perpétue le célèbre filigrane d'or et d'argent de Ndar : boucles créoles, colliers grain d'or et bagues ciselées à la main.",
    yearsExperience: 25,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Bijoux en filigrane d'or et d'argent de Saint-Louis",
      "Création de bagues et alliances sur mesure",
      "Transformation et réparation de bijoux",
      "Commandes personnalisées avec poinçon",
    ],
    photos: [
      { url: "/images/seed/bijouterie-1.jpg", caption: "Savoir-faire traditionnel à Saint-Louis" },
      { url: "/images/seed/bijouterie-2.jpg", caption: "Travail minutieux des détails" },
    ],
    daysAgo: 45,
  },
  {
    id: "art-nabil-khelifi",
    fullName: "Nabil Khelifi",
    businessName: "Menuiserie El Djazaïr Bois",
    categorySlug: "menuiserie",
    countryCode: "DZ",
    cityName: "Oran",
    phone: "+213 552 38 90 14",
    email: "nabil@eldjazairbois.dz",
    bio: "Menuisier agenceur à Oran, Nabil Khelifi fabrique des cuisines équipées sur mesure, dressings, portes intérieures en chêne et hêtre ainsi que des moucharabiehs contemporains.",
    yearsExperience: 13,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Cuisines sur mesure et plans de travail bois",
      "Dressings et placards coulissants",
      "Portes intérieures et escaliers bois",
      "Moucharabiehs et claustras décoratifs",
    ],
    photos: [
      { url: "/images/seed/menuiserie-1.jpg", caption: "Travail du bois massif à l'atelier d'Oran" },
      { url: "/images/seed/menuiserie-2.jpg", caption: "Détail de sculpture et assemblage" },
    ],
    daysAgo: 38,
  },
  {
    id: "art-aissatou-ba",
    fullName: "Aïssatou Ba",
    businessName: "Cuirs & Sandales du Sahel",
    categorySlug: "maroquinerie",
    countryCode: "SN",
    cityName: "Dakar",
    phone: "+221 76 519 40 33",
    email: "aissatou@cuirssahel.sn",
    bio: "Artisane maroquinière aux Almadies (Dakar), Aïssatou Ba crée des sacs à main, pochettes associant cuir et pagne tissé manjak, ainsi que des sandales cousues main.",
    yearsExperience: 10,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Sacs à main cuir et pagne tissé",
      "Sandales artisanales sur mesure",
      "Petite maroquinerie et cadeaux d'entreprise",
      "Réparation et entretien du cuir",
    ],
    photos: [
      { url: "/images/seed/maroquinerie-1.jpg", caption: "Assemblage cuir et textile à Dakar" },
      { url: "/images/seed/maroquinerie-2.jpg", caption: "Finition sellier à l'atelier" },
    ],
    daysAgo: 31,
  },
  {
    id: "art-samuel-otieno",
    fullName: "Samuel Otieno",
    businessName: "Mombasa Coastal Weld & Iron",
    categorySlug: "ferronnerie",
    countryCode: "KE",
    cityName: "Mombasa",
    phone: "+254 711 490 327",
    email: "samuel@coastalweld.co.ke",
    bio: "Architectural metalworker in Mombasa fabricating marine-grade stainless steel railings, security gates, spiral staircases, and decorative laser-cut screens.",
    yearsExperience: 14,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Marine-grade stainless steel balustrades",
      "Wrought-iron driveway gates",
      "Custom steel pergolas & carports",
      "On-site mobile welding & repairs",
    ],
    photos: [
      { url: "/images/seed/ferronnerie-1.jpg", caption: "Contrôle technique et métallerie à Mombasa" },
      { url: "/images/seed/ferronnerie-2.jpg", caption: "Finition des éléments d'atelier" },
    ],
    daysAgo: 25,
  },
  {
    id: "art-adebayo-balogun",
    fullName: "Adebayo Balogun",
    businessName: "Abuja Master Painters",
    categorySlug: "peinture",
    countryCode: "NG",
    cityName: "Abuja",
    phone: "+234 809 312 7740",
    email: "adebayo@abujapainters.ng",
    bio: "Interior and exterior painting specialist in Abuja delivering smooth skim-coating, textured accent walls, epoxy garage floors, and weatherproof facade coatings.",
    yearsExperience: 11,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Interior & exterior residential painting",
      "POP screeding & smooth wall preparation",
      "Decorative textured & accent walls",
      "Epoxy floor coating for garages & showrooms",
    ],
    photos: [
      { url: "/images/seed/peinture-1.jpg", caption: "Préparation des murs sur chantier à Abuja" },
      { url: "/images/seed/peinture-2.jpg", caption: "Nuancier et finitions décoratives" },
    ],
    daysAgo: 18,
  },
  {
    id: "art-salimata-ouattara",
    fullName: "Salimata Ouattara",
    businessName: "Tisserands de Bouaké",
    categorySlug: "tissage",
    countryCode: "CI",
    cityName: "Bouaké",
    phone: "+225 01 42 78 53 10",
    email: "salimata@tisserands-bouake.ci",
    bio: "Maître tisserande à Bouaké, Salimata Ouattara dirige un atelier de tissage de pagne Baoulé et Kita en pur coton teint naturellement, très prisé des stylistes d'Afrique de l'Ouest.",
    yearsExperience: 16,
    featured: false,
    status: "PUBLISHED",
    services: [
      "Pagne tissé Baoulé et Kita sur commande",
      "Teinture artisanale grand teint",
      "Jetés de lit et coussins en coton tissé",
      "Fourniture en gros pour créateurs de mode",
    ],
    photos: [
      { url: "/images/seed/tissage-1.jpg", caption: "Pagnes tissés exposés à l'atelier de Bouaké" },
      { url: "/images/seed/tissage-2.jpg", caption: "Détail des motifs et couleurs" },
    ],
    daysAgo: 12,
  },
  // 2 DRAFT artisans & 2 ARCHIVED artisans for back-office filter coverage
  {
    id: "art-draft-leila-mansouri",
    fullName: "Leïla Mansouri",
    businessName: "Céramiques de Tlemcen",
    categorySlug: "poterie",
    countryCode: "DZ",
    cityName: "Tlemcen",
    phone: "+213 561 40 22 19",
    email: "leila@ceramiques-tlemcen.dz",
    bio: "Céramiste à Tlemcen spécialisée dans la vaisselle émaillée et les carreaux décoratifs inspirés de l'art zianide. Fiche en cours de vérification avant publication.",
    yearsExperience: 7,
    featured: false,
    status: "DRAFT",
    services: ["Vaisselle en céramique émaillée", "Carreaux décoratifs peints à la main"],
    photos: [{ url: "/images/seed/poterie-1.jpg", caption: "Tournage de pièces en argile" }],
    daysAgo: 6,
  },
  {
    id: "art-draft-desire-hounkpatin",
    fullName: "Désiré Hounkpatin",
    businessName: "Élec & Solaire Porto-Novo",
    categorySlug: "electricite",
    countryCode: "BJ",
    cityName: "Porto-Novo",
    phone: "+229 96 18 44 09",
    email: "desire@elecsolaire.bj",
    bio: "Électricien bâtiment et installateur solaire à Porto-Novo. Profil en brouillon en attente des photos de chantier.",
    yearsExperience: 6,
    featured: false,
    status: "DRAFT",
    services: ["Installation électrique domestique", "Maintenance d'onduleurs solaires"],
    photos: [{ url: "/images/seed/electricite-1.jpg", caption: "Intervention sur tableau électrique" }],
    daysAgo: 3,
  },
  {
    id: "art-archived-oumar-sy",
    fullName: "Oumar Sy",
    businessName: "Ancien Atelier Sy Menuiserie",
    categorySlug: "menuiserie",
    countryCode: "SN",
    cityName: "Ziguinchor",
    phone: "+221 77 210 09 44",
    email: "oumar.sy@menuiserie-zig.sn",
    bio: "Menuisier charpentier en Casamance, fiche archivée pendant sa période de congé sabbatique.",
    yearsExperience: 21,
    featured: false,
    status: "ARCHIVED",
    services: ["Charpente bois traditionnelle", "Mobilier de jardin en teck"],
    photos: [{ url: "/images/seed/menuiserie-1.jpg", caption: "Atelier de Ziguinchor" }],
    daysAgo: 200,
  },
  {
    id: "art-archived-hicham-bennis",
    fullName: "Hicham Gharbi",
    businessName: "Sousse Déco Peinture",
    categorySlug: "peinture",
    countryCode: "TN",
    cityName: "Sousse",
    phone: "+216 24 12 50 93",
    email: "h.gharbi@soussedeco.tn",
    bio: "Artisan peintre à Sousse. Fiche temporairement archivée car le carnet de commandes est complet pour le semestre.",
    yearsExperience: 15,
    featured: false,
    status: "ARCHIVED",
    services: ["Peinture intérieure de finition", "Enduits décoratifs traditionnels"],
    photos: [{ url: "/images/seed/peinture-1.jpg", caption: "Chantier de rénovation à Sousse" }],
    daysAgo: 190,
  },
];

type SeedQuote = {
  reference: string;
  artisanId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  subject: string;
  description: string;
  budget: string;
  locale: "fr" | "en";
  status: "PENDING" | "IN_PROGRESS" | "FORWARDED" | "PROCESSED";
  forwardedToArtisan: boolean;
  internalNotes: string;
  daysAgo: number;
};

const QUOTES: SeedQuote[] = [
  {
    reference: "DEV-2026-0001",
    artisanId: "art-ibrahima-ndiaye",
    clientName: "Mariama Sow",
    clientEmail: "mariama.sow@teranga-hotel.sn",
    clientPhone: "+221 77 831 20 14",
    subject: "Table à manger 10 personnes en acajou + 10 chaises",
    description:
      "Bonjour Ibrahima, nous souhaitons faire fabriquer une grande table rectangulaire (280 × 110 cm) en bois d'acajou massif avec 10 chaises assorties pour notre salle à manger aux Almadies. Délai souhaité : 6 semaines.",
    budget: "950 000 FCFA",
    locale: "fr",
    status: "PROCESSED",
    forwardedToArtisan: true,
    internalNotes: "Devis validé par la cliente le 14/03. Acompte de 40 % versé à l'atelier.",
    daysAgo: 260,
  },
  {
    reference: "DEV-2026-0002",
    artisanId: "art-awa-kone",
    clientName: "Christelle Kouassi",
    clientEmail: "c.kouassi@outlook.com",
    clientPhone: "+225 07 09 45 18 22",
    subject: "Tenues de mariage traditionnel en pagne tissé Baoulé",
    description:
      "Nous préparons notre mariage coutumier à Abidjan et cherchons une création sur mesure pour la mariée et le marié en pagne tissé Baoulé royal avec broderies dorées, plus 4 tenues pour le cortège.",
    budget: "650 000 FCFA",
    locale: "fr",
    status: "PROCESSED",
    forwardedToArtisan: true,
    internalNotes: "Premier essayage réalisé à Cocody. Livraison effectuée dans les délais.",
    daysAgo: 230,
  },
  {
    reference: "DEV-2026-0003",
    artisanId: "art-youssef-benali",
    clientName: "Farid Meziane",
    clientEmail: "farid.meziane@dar-ziri.dz",
    clientPhone: "+213 551 90 12 34",
    subject: "Commande de 16 poufs en cuir naturel pour maison d'hôtes à Oran",
    description:
      "Dans le cadre de la rénovation de notre maison d'hôtes, nous souhaitons commander 16 poufs en cuir tanné végétal (coloris cognac et tabac) avec broderie traditionnelle ton sur ton.",
    budget: "280 000 DZD",
    locale: "fr",
    status: "PROCESSED",
    forwardedToArtisan: true,
    internalNotes: "Échantillons de cuir approuvés. Expédition Tlemcen → Oran effectuée.",
    daysAgo: 205,
  },
  {
    reference: "DEV-2026-0004",
    artisanId: "art-karim-boudiaf",
    clientName: "Rachid Hamidi",
    clientEmail: "r.hamidi@clinique-littoral.dz",
    clientPhone: "+213 550 12 88 49",
    subject: "Installation solaire hybride 8 kWc pour villa à Canastel (Oran)",
    description:
      "Je souhaite installer un kit photovoltaïque hybride de 8 kWc avec onduleur et batterie lithium 10 kWh sur le toit-terrasse de ma villa à Canastel, plus la remise aux normes du tableau principal.",
    budget: "1 450 000 DZD",
    locale: "fr",
    status: "PROCESSED",
    forwardedToArtisan: true,
    internalNotes: "Visite technique effectuée à Canastel. Chantier réceptionné avec succès.",
    daysAgo: 175,
  },
  {
    reference: "DEV-2026-0005",
    artisanId: "art-kwame-mensah",
    clientName: "Kofi Asante",
    clientEmail: "kofi.asante@accraevents.gh",
    clientPhone: "+233 24 812 30 19",
    subject: "Custom double-weave Kente cloth for traditional engagement",
    description:
      "Looking for two matching full-length double-weave Kente cloths in gold, emerald green and black with the Adwinasa pattern for an engagement ceremony in Kumasi.",
    budget: "9,500 GHS",
    locale: "en",
    status: "PROCESSED",
    forwardedToArtisan: true,
    internalNotes: "Loom work completed in 4 weeks. Client picked up in Kumasi.",
    daysAgo: 150,
  },
  {
    reference: "DEV-2026-0006",
    artisanId: "art-aminata-traore",
    clientName: "Bintou Keïta",
    clientEmail: "b.keita@hotel-mandé.ml",
    clientPhone: "+223 76 11 45 80",
    subject: "40 suspensions en terre cuite ajourée et grandes jarres d'accueil",
    description:
      "Pour l'écolodge que nous ouvrons au bord du fleuve, nous souhaitons 40 abat-jours en céramique ajourée et 8 grandes jarres décoratives de 90 cm de hauteur.",
    budget: "1 200 000 FCFA",
    locale: "fr",
    status: "PROCESSED",
    forwardedToArtisan: true,
    internalNotes: "Commande livrée en deux lots par la coopérative de Ségou.",
    daysAgo: 125,
  },
  {
    reference: "DEV-2026-0007",
    artisanId: "art-jean-paul-mbarga",
    clientName: "Thierry Essomba",
    clientEmail: "t.essomba@gmail.com",
    clientPhone: "+237 6 94 20 81 55",
    subject: "Construction d'un mur de clôture de 65 mètres linéaires à Bonamoussadi",
    description:
      "Terrain titré à Bonamoussadi (Douala). Besoin d'un devis complet main-d'œuvre + matériaux pour une clôture en agglos de 15 avec poteaux raidisseurs tous les 3 m et longrine béton.",
    budget: "4 800 000 FCFA",
    locale: "fr",
    status: "FORWARDED",
    forwardedToArtisan: true,
    internalNotes: "Transmise à Jean-Paul Mbarga après vérification du plan cadastral.",
    daysAgo: 98,
  },
  {
    reference: "DEV-2026-0008",
    artisanId: "art-grace-wanjiku",
    clientName: "David Mwangi",
    clientEmail: "david.mwangi@safari-camps.co.ke",
    clientPhone: "+254 733 501 820",
    subject: "Hardwood dining tables and bedside cabinets for 6 eco-cottages",
    description:
      "We are furnishing 6 boutique cottages near Naivasha and need 6 solid wood dining tables (6-seater), 12 bedside tables, and 6 luggage racks finished in natural matte oil.",
    budget: "780,000 KES",
    locale: "en",
    status: "FORWARDED",
    forwardedToArtisan: true,
    internalNotes: "Forwarded to Grace Wanjiku. Site visit scheduled for next Tuesday.",
    daysAgo: 74,
  },
  {
    reference: "DEV-2026-0009",
    artisanId: "art-chinedu-okafor",
    clientName: "Funke Adeyemi",
    clientEmail: "funke.adeyemi@lagosliving.ng",
    clientPhone: "+234 802 910 4412",
    subject: "Complete plumbing overhaul for 4-bedroom duplex in Lekki Phase 1",
    description:
      "Need full replacement of concealed PPR water lines, installation of 4 wall-hung WC suites, silent booster pump, and a 300L solar water heater.",
    budget: "3,200,000 NGN",
    locale: "en",
    status: "IN_PROGRESS",
    forwardedToArtisan: true,
    internalNotes: "Bill of quantities under review with client.",
    daysAgo: 55,
  },
  {
    reference: "DEV-2026-0010",
    artisanId: "art-nabil-khelifi",
    clientName: "Amel Benmansour",
    clientEmail: "amel.benmansour@yahoo.fr",
    clientPhone: "+213 554 67 21 09",
    subject: "Cuisine sur mesure en chêne massif et îlot central à Akid Lotfi (Oran)",
    description:
      "Nous rénovons notre appartement à Akid Lotfi et souhaitons une cuisine en L de 4,20 × 2,80 m avec façades en chêne naturel, îlot central et grand placard toute hauteur.",
    budget: "680 000 DZD",
    locale: "fr",
    status: "IN_PROGRESS",
    forwardedToArtisan: true,
    internalNotes: "Prise de cotes prévue cette semaine avec Nabil.",
    daysAgo: 40,
  },
  {
    reference: "DEV-2026-0011",
    artisanId: "art-khadija-alami",
    clientName: "Salima Khelif",
    clientEmail: "salima.khelif@mode-constantine.dz",
    clientPhone: "+213 556 44 19 80",
    subject: "Création d'une parure en argent ciselé et corail pour mariage",
    description:
      "Je recherche une parure complète (collier, boucles d'oreilles et bracelet manchette) en argent ciselé et corail véritable avec finition traditionnelle.",
    budget: "185 000 DZD",
    locale: "fr",
    status: "FORWARDED",
    forwardedToArtisan: true,
    internalNotes: "Croquis envoyés par Meriem à la cliente.",
    daysAgo: 29,
  },
  {
    reference: "DEV-2026-0012",
    artisanId: "art-koffi-ahouansou",
    clientName: "Sébastien Zinsou",
    clientEmail: "s.zinsou@immo-littoral.bj",
    clientPhone: "+229 97 88 04 51",
    subject: "Portail coulissant motorisable 4,50 m en fer forgé anti-corrosion",
    description:
      "Pour une résidence à Fidjrossè (Cotonou), besoin d'un portail coulissant de 4,50 m × 2,20 m avec portillon piéton assorti, galvanisé à chaud et thermolaqué gris anthracite.",
    budget: "1 600 000 FCFA",
    locale: "fr",
    status: "IN_PROGRESS",
    forwardedToArtisan: false,
    internalNotes: "En attente des photos de l'entrée actuelle demandées au client.",
    daysAgo: 20,
  },
  {
    reference: "DEV-2026-0013",
    artisanId: "art-sofiane-merabet",
    clientName: "Yacine Belkacem",
    clientEmail: "y.belkacem@cabinet-hydra.dz",
    clientPhone: "+213 560 91 34 27",
    subject: "Enduit tadelakt et peinture velours pour cabinet d'architecture à Hydra",
    description:
      "Nous souhaitons réaliser un mur d'accueil en tadelakt couleur terre de Sienne (28 m²) et la mise en peinture complète de 180 m² de bureaux à Hydra (Alger).",
    budget: "420 000 DZD",
    locale: "fr",
    status: "PENDING",
    forwardedToArtisan: false,
    internalNotes: "",
    daysAgo: 14,
  },
  {
    reference: "DEV-2026-0014",
    artisanId: "art-ibrahima-ndiaye",
    clientName: "Abdoulaye Diagne",
    clientEmail: "a.diagne@archidakar.sn",
    clientPhone: "+221 77 503 91 66",
    subject: "Habillage mural acoustique à lattes de teck et comptoir d'accueil",
    description:
      "Dans le cadre de l'aménagement d'un cabinet au Plateau à Dakar, nous avons besoin d'un comptoir d'accueil cintré en bois de teck et de 35 m² de tasseaux muraux.",
    budget: "2 100 000 FCFA",
    locale: "fr",
    status: "PENDING",
    forwardedToArtisan: false,
    internalNotes: "",
    daysAgo: 9,
  },
  {
    reference: "DEV-2026-0015",
    artisanId: "art-adjoa-owusu",
    clientName: "Ama Boateng",
    clientEmail: "ama.boateng@gmail.com",
    clientPhone: "+233 24 609 71 38",
    subject: "Bespoke Kente corset gown + groom's wrap for December wedding",
    description:
      "Hi Adjoa, my fiancé and I are getting married in Accra on December 28th. I'd love a fitted Kente corset gown with detachable train and a matching men's cloth.",
    budget: "14,000 GHS",
    locale: "en",
    status: "PENDING",
    forwardedToArtisan: false,
    internalNotes: "",
    daysAgo: 6,
  },
  {
    reference: "DEV-2026-0016",
    artisanId: "art-fatou-diop",
    clientName: "Ndeye Astou Fall",
    clientEmail: "astou.fall@orange.sn",
    clientPhone: "+221 78 412 08 55",
    subject: "Forfait coiffure mariée + 5 demoiselles d'honneur à Thiès",
    description:
      "Bonjour Fatou, je me marie le mois prochain à Thiès et je voudrais réserver un forfait coiffure de mariée avec chignon tressé et accessoires dorés, plus 5 demoiselles d'honneur.",
    budget: "175 000 FCFA",
    locale: "fr",
    status: "PENDING",
    forwardedToArtisan: false,
    internalNotes: "",
    daysAgo: 4,
  },
  {
    reference: "DEV-2026-0017",
    artisanId: "art-karim-boudiaf",
    clientName: "Mehdi Zerrouki",
    clientEmail: "m.zerrouki@oran-logistique.dz",
    clientPhone: "+213 551 83 06 42",
    subject: "Éclairage LED industriel et mise en conformité tableau entrepôt Es Sénia",
    description:
      "Entrepôt de 600 m² en zone industrielle d'Es Sénia (Oran) : remplacement de l'éclairage par 24 cloches LED haute luminosité et refonte complète de l'armoire TGBT.",
    budget: "590 000 DZD",
    locale: "fr",
    status: "PENDING",
    forwardedToArtisan: false,
    internalNotes: "",
    daysAgo: 2,
  },
  {
    reference: "DEV-2026-0018",
    artisanId: "art-awa-kone",
    clientName: "Inès Bamba",
    clientEmail: "ines.bamba@ivoire-events.ci",
    clientPhone: "+225 07 77 12 34 90",
    subject: "Collection de 12 tenues d'hôtesses en wax et lin pour salon professionnel",
    description:
      "Nous organisons un forum économique au Sofitel Hôtel Ivoire et souhaitons faire confectionner 12 tailleurs élégants en lin écru rehaussés de parements en pagne tissé ivoirien.",
    budget: "840 000 FCFA",
    locale: "fr",
    status: "PENDING",
    forwardedToArtisan: false,
    internalNotes: "",
    daysAgo: 1,
  },
];

function daysBeforeNow(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

async function main() {
  console.log("🌱 Seeding AFRIMÉTIERS HUB database…");

  await prisma.quoteEvent.deleteMany();
  await prisma.quoteRequest.deleteMany();
  await prisma.artisanPhoto.deleteMany();
  await prisma.artisanService.deleteMany();
  await prisma.artisan.deleteMany();
  await prisma.city.deleteMany();
  await prisma.country.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // 1. Users (ADMIN + VIEWER for 403 testing)
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@afrimetiers.com").toLowerCase();
  const adminUsername = (process.env.SEED_ADMIN_USERNAME ?? "admin").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@2026!";

  const [adminHash, viewerHash] = await Promise.all([
    bcrypt.hash(adminPassword, 12),
    bcrypt.hash("Viewer@2026!", 12),
  ]);

  const adminUser = await prisma.user.create({
    data: {
      email: adminEmail,
      username: adminUsername,
      name: "Administrateur AFRIMÉTIERS",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      email: "viewer@afrimetiers.com",
      username: "viewer",
      name: "Lecteur Audit (Sans droits admin)",
      passwordHash: viewerHash,
      role: "VIEWER",
    },
  });

  // 2. Categories
  const categoryBySlug = new Map<string, { id: number; nameFr: string; nameEn: string }>();
  for (const cat of CATEGORIES) {
    const row = await prisma.category.create({ data: cat });
    categoryBySlug.set(row.slug, row);
  }

  // 3. Countries & Cities
  const countryByCode = new Map<string, { id: number; nameFr: string; nameEn: string }>();
  const cityByKey = new Map<string, { id: number; name: string }>();
  for (const c of COUNTRIES) {
    const country = await prisma.country.create({
      data: { code: c.code, nameFr: c.nameFr, nameEn: c.nameEn },
    });
    countryByCode.set(c.code, country);
    for (const cityName of c.cities) {
      const city = await prisma.city.create({
        data: { name: cityName, countryId: country.id },
      });
      cityByKey.set(`${c.code}:${cityName}`, city);
    }
  }

  // 4. Artisans
  const artisanNameById = new Map<string, string>();
  for (const a of ARTISANS) {
    const category = categoryBySlug.get(a.categorySlug)!;
    const country = countryByCode.get(a.countryCode)!;
    const city = cityByKey.get(`${a.countryCode}:${a.cityName}`)!;
    const createdAt = daysBeforeNow(a.daysAgo);
    const searchText = normalizeText(
      [
        a.fullName,
        a.businessName,
        a.email,
        category.nameFr,
        category.nameEn,
        city.name,
        country.nameFr,
        country.nameEn,
        a.services.join(" "),
        a.bio,
      ].join(" "),
    );

    await prisma.artisan.create({
      data: {
        id: a.id,
        fullName: a.fullName,
        businessName: a.businessName,
        categoryId: category.id,
        countryId: country.id,
        cityId: city.id,
        phone: a.phone,
        email: a.email,
        website: a.website ?? null,
        bio: a.bio,
        yearsExperience: a.yearsExperience,
        featured: a.featured,
        status: a.status,
        searchText,
        publishedAt: a.status === "PUBLISHED" ? createdAt : null,
        createdAt,
        updatedAt: createdAt,
        services: {
          create: a.services.map((name, position) => ({ name, position })),
        },
        photos: {
          create: a.photos.map((p, position) => ({ url: p.url, caption: p.caption, position, createdAt })),
        },
      },
    });
    artisanNameById.set(a.id, a.fullName);
  }

  // 5. Quote Requests + Status History Logs
  for (const q of QUOTES) {
    const createdAt = daysBeforeNow(q.daysAgo);
    const forwardedAt = q.forwardedToArtisan ? new Date(createdAt.getTime() + 6 * 3600 * 1000) : null;
    const processedAt = q.status === "PROCESSED" ? new Date(createdAt.getTime() + 36 * 3600 * 1000) : null;

    const events: {
      type: string;
      fromStatus?: string;
      toStatus?: string;
      userId?: string;
      createdAt: Date;
    }[] = [{ type: "CREATED", toStatus: "PENDING", createdAt }];

    if (q.status === "IN_PROGRESS" || q.status === "FORWARDED" || q.status === "PROCESSED") {
      events.push({
        type: "STATUS_CHANGED",
        fromStatus: "PENDING",
        toStatus: "IN_PROGRESS",
        userId: adminUser.id,
        createdAt: new Date(createdAt.getTime() + 2 * 3600 * 1000),
      });
    }
    if (q.forwardedToArtisan && forwardedAt) {
      events.push({
        type: "FORWARDED",
        userId: adminUser.id,
        createdAt: forwardedAt,
      });
    }
    if (q.status === "FORWARDED" || q.status === "PROCESSED") {
      events.push({
        type: "STATUS_CHANGED",
        fromStatus: "IN_PROGRESS",
        toStatus: "FORWARDED",
        userId: adminUser.id,
        createdAt: new Date(createdAt.getTime() + 6 * 3600 * 1000),
      });
    }
    if (q.internalNotes) {
      events.push({
        type: "NOTE_UPDATED",
        userId: adminUser.id,
        createdAt: new Date(createdAt.getTime() + 12 * 3600 * 1000),
      });
    }
    if (q.status === "PROCESSED" && processedAt) {
      events.push({
        type: "STATUS_CHANGED",
        fromStatus: "FORWARDED",
        toStatus: "PROCESSED",
        userId: adminUser.id,
        createdAt: processedAt,
      });
    }

    await prisma.quoteRequest.create({
      data: {
        reference: q.reference,
        publicToken: randomBytes(24).toString("base64url"),
        artisanId: q.artisanId,
        artisanName: artisanNameById.get(q.artisanId) ?? "Artisan",
        clientName: q.clientName,
        clientEmail: q.clientEmail,
        clientPhone: q.clientPhone,
        subject: q.subject,
        description: q.description,
        budget: q.budget,
        locale: q.locale,
        status: q.status,
        internalNotes: q.internalNotes,
        forwardedToArtisan: q.forwardedToArtisan,
        forwardedAt,
        processedAt,
        createdAt,
        updatedAt: processedAt ?? forwardedAt ?? createdAt,
        events: { create: events },
      },
    });
  }

  console.log(
    `✅ Seeded ${CATEGORIES.length} categories, ${COUNTRIES.length} countries, ${cityByKey.size} cities, ${ARTISANS.length} artisans, ${QUOTES.length} quote requests.`,
  );
  console.log(`🔐 Admin login: ${adminEmail} (or "${adminUsername}") / ${adminPassword}`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
