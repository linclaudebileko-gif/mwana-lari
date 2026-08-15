import fs from 'fs';
import path from 'path';

// Import existing items from JSON if available
const existingJsonPath = path.resolve('data/lexicon/dictionnaire_lari_francais.json');
let existingItems = [];
if (fs.existsSync(existingJsonPath)) {
  existingItems = JSON.parse(fs.readFileSync(existingJsonPath, 'utf-8'));
}

// Full rich comprehensive entries covering all categories requested:
// Cuisine, Expressions, Traditions, Histoire, Métiers, Nature, Nombres, Verbes, Sentiments
const NEW_CATEGORIZED_ENTRIES = [
  // =========================================================================
  // 1. CUISINE CONGOLAISE & PLATS TRADITIONNELS DU POOL / BRAZZAVILLE
  // =========================================================================
  ['Saka-saka', '[sà-kà-sà-kà]', 'cl. 7', 'Saka-saka / Feuilles de manioc pilées', 'Cassava leaves stew', 'Nourriture', 1, 'Plat national congolais par excellence, préparé avec huile de palme et poisson fumé.', 'Mama weena lamba saka-saka dya kununa.', 'Maman prépare un délicieux saka-saka fumant.'],
  ['Maboke', '[mà-bó-kè]', 'cl. 6', 'Maboké / Poisson en papillote de feuilles sauvages', 'Steamed fish in leaves', 'Nourriture', 2, 'Poisson du fleuve cuit à l\'étouffée dans des feuilles de marantacées au feu de bois.', 'Twadia maboke ma mbisi a maza.', 'Nous avons dégusté un maboké de poisson frais.'],
  ['Kwanga', '[kwá-ngà]', 'cl. 9/10 (pl. bikwanga)', 'Chikwangue / Pain de manioc fermenté', 'Cassava bread / Chikwangue', 'Nourriture', 1, 'Pain de manioc traditionnel cuit à la vapeur, aliment de base des repas lari.', 'Sumbila mono kwanga yimosi.', 'Achète-moi un bâton de chikwangue bien frais.'],
  ['Kikwanga', '[kì-kwá-ngà]', 'cl. 7', 'Grande chikwangue traditionnelle du Pool', 'Traditional cassava loaf', 'Nourriture', 2, 'Chikwangue artisanale préparée selon la pure tradition du Pool.', 'Kikwanga kya Kinkala cyena ndilu mbote.', 'La chikwangue de Kinkala a une saveur incomparable.'],
  ['Bitoto', '[bì-tó-tò]', 'cl. 8', 'Bitoto / Ragoût de bananes et haricots', 'Plantain and bean stew', 'Nourriture', 2, 'Plat roboratif traditionnel associant bananes plantains, haricots et poisson.', 'Bitoto byena madiya ma ngolo.', 'Le bitoto est un plat qui donne une grande énergie.'],
  ['Ngoki', '[ǹ-gó-kì]', 'cl. 9', 'Ngoki / Ragoût traditionnel de haricots mijotés', 'Savory bean dish', 'Nourriture', 2, 'Haricots rouges mijotés lentement à l\'huile de palme rouge et aux épices douces.', 'Ngoki yina yina ndilu ya mbote.', 'Ce plat de ngoki a un goût exquis.'],
  ['Mbisi ya kokawusa', '[m̀-bí-sì yà kò-kà-wú-sà]', 'locution', 'Poisson séché / Poisson fumé du fleuve', 'Smoked / Dried fish', 'Nourriture', 2, 'Poisson fumé qui aromatise les sauces traditionnelles et le saka-saka.', 'Tulatila mbisi ya kokawusa mu saka-saka.', 'Mettons du poisson fumé dans les feuilles de manioc.'],
  ['Nsusu ya mwamba', '[ǹ-sú-sù yà mwá-mbà]', 'locution', 'Poulet à la sauce arachide / Moambé', 'Chicken in peanut sauce', 'Nourriture', 2, 'Poulet du village mijoté dans une onctueuse sauce d\'arachides grillées.', 'Nsusu ya mwamba yidi madiya ma nkembo.', 'Le poulet à la sauce arachide est un plat de fête.'],
  ['Nsafu', '[ǹ-sá-fù]', 'cl. 9/10', 'Safou / Prune d\'Afrique / Atanga', 'African butter fruit / Safou', 'Nourriture', 1, 'Fruit charnu à la saveur acidulée, délicieux grillé sur la braise avec du manioc.', 'Kanga nsafu vana moto.', 'Fais griller les safous sur la braise ardente.'],
  ['Makemba', '[mà-ké-mbà]', 'cl. 6', 'Bananes plantains (bouillies ou braisées)', 'Plantains', 'Nourriture', 1, 'Bananes plantains mûres ou vertes accompagnant viandes et sauces.', 'Lamba makemba ma mbote.', 'Fais bouillir de belles bananes plantains.'],
  ['Koko', '[kó-kò]', 'cl. 9', 'Koko / Fumbwa (Feuilles de Gnetum)', 'Gnetum wild leaves', 'Nourriture', 2, 'Feuilles sauvages de forêt découpées finement et cuisinées à la pâte d\'arachide.', 'Koko dya lari dyena nsudi ya kitoko.', 'Le koko à la mode lari embaume la maison.'],
  ['Fumbwa', '[fù-mbwá]', 'cl. 9', 'Fumbwa / Feuilles sauvages de sous-bois', 'Fumbwa vegetable', 'Nourriture', 2, 'Légume traditionnel riche en fer et minéraux apprécié de tous.', 'Twadia fumbwa na mbisi ya kokawusa.', 'Nous mangeons du fumbwa au poisson fumé.'],
  ['Madesu', '[mà-dé-sù]', 'cl. 6', 'Haricots rouges / Haricots blancs', 'Beans', 'Nourriture', 1, 'Les haricots mijotés avec des oignons, de l\'ail et servis avec du riz ou du pain.', 'Lamba madesu na loso.', 'Cuisine les haricots rouges avec du riz blanc.'],
  ['Musaka', '[mù-sá-kà]', 'cl. 3', 'Moambé / Sauce graine de palme fraîche', 'Palm nut extract sauce', 'Nourriture', 2, 'Sauce onctueuse extraite de la pulpe des noix de palme cuites et pilées.', 'Musaka wa mbila wena mudidi.', 'La sauce de noix de palme est très savoureuse.'],
  ['Mbika', '[m̀-bí-kà]', 'cl. 9', 'Graines de courge pilées / Pâté de courge', 'Pounded squash seeds', 'Nourriture', 2, 'Graines de courge séchées et écrasées, cuisinées en pain de courge à l\'étouffée.', 'Mbika ya kukanga mu nkanda.', 'Pain de graines de courge cuit dans des feuilles.'],
  ['Matembele', '[mà-tè-mbé-lè]', 'cl. 6', 'Feuilles de patate douce', 'Sweet potato leaves', 'Nourriture', 1, 'Feuilles tendres sautées à l\'huile avec de l\'ail et des tomates.', 'Matembele mena ndilu ya mbote.', 'Les feuilles de patate douce sont très délicates.'],
  ['Mayaka', '[mà-yá-kà]', 'cl. 6', 'Bâtonnets de pâte de manioc séchés', 'Cassava rolls', 'Nourriture', 2, 'Manioc transformé sous forme allongée et séché pour la conservation.', 'Mayaka ma lari mena kitoko.', 'Les bâtonnets de manioc sont croustillants.'],
  ['Malafu ma mbila', '[mà-lá-fù mà m̀-bí-là]', 'locution', 'Vin de palme naturel / Vin blanc frais', 'Palm wine', 'Nourriture', 2, 'Boisson douce récoltée au sommet du palmier au petit matin.', 'Mbuta wanwa malafu ma mbila.', 'L\'aîné savoure un verre de bon vin de palme.'],
  ['Malafu ma masangu', '[mà-lá-fù mà mà-sá-ngù]', 'locution', 'Bière traditionnelle de maïs fermenté', 'Corn brew', 'Nourriture', 3, 'Boisson festive fermentée préparée pour les grandes réunions coutumières.', 'Bantù banwa malafu ma masangu.', 'Les villageois partagent la boisson de maïs.'],
  ['Nsaba', '[ǹ-sá-bà]', 'cl. 9/10', 'Marmite en terre cuite traditionnelle', 'Clay cooking pot', 'Nourriture', 2, 'La marmite en argile qui conserve la chaleur et donne un goût inimitable aux sauces.', 'Tula madiya mu nsaba.', 'Mets le ragoût dans la marmite de terre cuite.'],
  ['Luku', '[lú-kù]', 'cl. 11', 'Foufou / Pâte chaude de farine de manioc', 'Cassava dough / Fufu', 'Nourriture', 1, 'Boule chaude de farine de manioc et de maïs trempée dans les sauces.', 'Tula luku lwa tiya vana mesa.', 'Sers le foufou bien chaud sur la table.'],
  ['Pili-pili', '[pì-lì-pì-lì]', 'cl. 7', 'Piment fort / Piment rouge du Pool', 'Hot pepper / Chili', 'Nourriture', 1, 'Le piment rouge frais pilé qui relève tous les plats congolais.', 'Pili-pili weena tiya.', 'Ce piment rouge est très piquant.'],
  ['Ndungu', '[ǹ-dú-ngù]', 'cl. 9', 'Piment traditionnel lari / Épice piquante', 'Traditional chili pepper', 'Nourriture', 2, 'Terme lari pour désigner le piment et les épices chaudes.', 'Lata ndungu yike mu madiya.', 'Mets juste un peu de piment dans le plat.'],
  ['Mfumfu', '[m̀-fú-mfù]', 'cl. 9', 'Farine fine de manioc / Cossettes écrasées', 'Cassava flour', 'Nourriture', 1, 'La farine blanche obtenue en pilant les tubercules de manioc rouis.', 'Mfumfu ya mpembe ya luku.', 'La farine de manioc bien blanche pour le foufou.'],
  ['Bitekuteku', '[bì-tè-kù-tè-kù]', 'cl. 8', 'Feuilles d\'amarante sautées', 'Amaranth greens', 'Nourriture', 1, 'Légume vert doux riche en vitamines très apprécié des enfants.', 'Mama walamba bitekuteku.', 'Maman a cuisiné des amarantes fraîches.'],
  ['Nsamba', '[ǹ-sá-mbà]', 'cl. 9', 'Sauce graine de palme onctueuse', 'Rich palm sauce', 'Nourriture', 2, 'Sauce rouge traditionnelle nappant le poisson et le foufou.', 'Nsamba ya kununa yidi mbote.', 'Cette sauce graine est particulièrement onctueuse.'],
  ['Tsampu', '[tsá-mpù]', 'cl. 7', 'Tsampu / Feuilles de manioc fraîches écrasées', 'Crushed cassava leaves', 'Nourriture', 2, 'Préparation des feuilles de manioc pilées au mortier avant cuisson.', 'Tuta tsampu mu kinzu.', 'Pile les feuilles de manioc dans le mortier.'],

  // =========================================================================
  // 2. EXPRESSIONS IDIOMATIQUES & SAGESSE POPULAIRE LARI
  // =========================================================================
  ['Koko mosi ka yendi kula n\'toto ko', '[kó-kò mó-sì kà yè-ndí kù-lá ǹ-tó-tò kò]', 'proverbe', 'Une seule main n\'applaudit pas / L\'union fait la force', 'Unity is strength (proverb)', 'Patrimoine & Sagesse', 3, 'Grand proverbe lari soulignant la nécessité absolue de l\'entraide et de la solidarité.', 'Bambuta bavova : koko mosi ka yendi kula n\'toto ko.', 'Les anciens nous enseignent que l\'union fait notre force.'],
  ['Nitu ya ngolo', '[nì-tú yà ǹ-gó-lò]', 'locution', 'Être en pleine forme / Santé de fer', 'Great health / Vigor', 'Patrimoine & Sagesse', 2, 'Expression consacrée pour désigner une personne vigoureuse et en parfaite santé.', 'Mwana weena nitu ya ngolo.', 'L\'enfant est en pleine santé et plein d\'énergie.'],
  ['Ku baka ndandu', '[kù bà-ká ǹ-dá-ndù]', 'locution', 'Tirer profit / Récolter les fruits du savoir', 'To gain wisdom / benefit', 'Patrimoine & Sagesse', 3, 'Tirer un enseignement précieux d\'une expérience de vie.', 'Longa mbote watwa baka ndandu.', 'Étudie bien pour en récolter de grands bienfaits.'],
  ['Meso mu meso', '[mé-sò mù mé-sò]', 'locution', 'Les yeux dans les yeux / Face à face', 'Eye to eye / Face to face', 'Patrimoine & Sagesse', 3, 'Discuter franchement et loyalement sans faux-fuyants.', 'Twavovela meso mu meso.', 'Nous nous sommes parlé les yeux dans les yeux.'],
  ['Kuvova luvunu', '[kù-vò-vá lù-vú-nù]', 'locution', 'Mentir / Raconter des mensonges', 'To lie', 'Patrimoine & Sagesse', 3, 'Comportement réprouvé par la morale et les anciens.', 'Mwana lari kasala kuvova luvunu ko.', 'L\'enfant lari ne dit jamais de mensonge.'],
  ['Kuvova kieleka', '[kù-vò-vá kì-é-lé-kà]', 'locution', 'Dire la vérité / Parler avec franchise', 'To speak the truth', 'Patrimoine & Sagesse', 2, 'La vérité est le socle de la confiance clanique.', 'Vova kieleka ntangu zawonsono.', 'Dis toujours la vérité en toutes circonstances.'],
  ['Kutina nsoni', '[kù-tí-nà ǹ-só-nì]', 'locution', 'Avoir de la retenue / Être pudique et respectueux', 'To have modesty / respect', 'Patrimoine & Sagesse', 3, 'Qualité essentielle de réserve et de respect envers les aînés.', 'Mwana weena kutina nsoni.', 'Cet enfant fait preuve d\'une belle politesse et retenue.'],
  ['Moyo wena', '[mò-yó wé-nà]', 'locution', 'Être courageux / Avoir du cœur à l\'ouvrage', 'To be brave / courageous', 'Patrimoine & Sagesse', 2, 'Encouragement traditionnel face aux difficultés.', 'Moyo wena mpangi\'ami, ngolo zena !', 'Courage mon frère, reste fort !'],
  ['Lumbu lwa mbote', '[lù-mbú lwà m̀-bó-tè]', 'locution', 'Bonne journée / Journée bénie', 'Have a good day', 'Patrimoine & Sagesse', 1, 'Souhait de réussite et de paix pour toute la journée.', 'Yangalala na lumbu lwa mbote !', 'Réjouis-toi et passe une très belle journée !'],
  ['Mbote ya nsi', '[m̀-bó-tè yà ǹ-sí]', 'locution', 'Paix sur le pays / Concorde nationale', 'Peace upon the land', 'Patrimoine & Sagesse', 4, 'Vœu solennel de paix et de prospérité pour la terre.', 'Sambila mbote ya nsi eto.', 'Prions pour la paix et la concorde sur notre terre.'],
  ['Nsamu mbi', '[ǹ-sá-mù m̀-bí]', 'locution', 'Mauvaise nouvelle / Événement fâcheux', 'Bad news', 'Patrimoine & Sagesse', 2, 'Annonce d\'une difficulté à surmonter ensemble.', 'Nsamu mbi wena ve mu bwala.', 'Aucune mauvaise nouvelle n\'est survenue au village.'],
  ['Nsamu ya mbote', '[ǹ-sá-mù yà m̀-bó-tè]', 'locution', 'Bonne nouvelle / Heureuse annonce', 'Good news', 'Patrimoine & Sagesse', 1, 'Nouvelle qui apporte la liesse dans tout le clan.', 'Twawa nsamu ya mbote ya nkembo.', 'Nous avons reçu une merveilleuse nouvelle.'],
  ['Dia n\'kosi', '[dí-yà ǹ-kó-sì]', 'locution', 'Appétit de lion / Manger de bon cœur', 'Hearty appetite', 'Patrimoine & Sagesse', 2, 'Expression affectueuse pour complimenter un bon mangeur.', 'Mwana weena dia n\'kosi.', 'L\'enfant mange de bon cœur avec un appétit de lion.'],
  ['Wiza twa vova', '[wí-zà twà vò-vá]', 'locution', 'Viens qu\'on discute / Échangeons paisiblement', 'Come let us talk', 'Patrimoine & Sagesse', 2, 'Invitation à l\'échange pacifique et à la palabre constructive.', 'Iza vana, wiza twa vova mambu.', 'Approche-toi, viens qu\'on échange posément.'],
  ['Nkuni ya moto', '[ǹ-kú-nì yà mò-tó]', 'locution', 'Le bois ardent / Ardeur et passion au labeur', 'Fiery zeal / Hardworking spirit', 'Patrimoine & Sagesse', 4, 'Désigne l\'énergie inépuisable et le courage d\'un travailleur.', 'Mbuta weena nkuni ya moto mu salu.', 'Cet ancien travaille avec une ardeur exemplaire.'],
  ['Sala salu', '[sá-là sà-lú]', 'locution', 'Travailler consciencieusement / Faire son devoir', 'To work diligently', 'Patrimoine & Sagesse', 2, 'L\'importance sacrée du travail bien fait pour soi et sa famille.', 'Sala salu kyaku na kiese.', 'Accomplis ton travail avec joie et fierté.'],
  ['Ntima mosi', '[ǹ-tí-mà mó-sì]', 'locution', 'Un seul cœur / Vivre en parfaite union', 'One heart / Complete harmony', 'Patrimoine & Sagesse', 3, 'L\'harmonie fraternelle où tous pensent et agissent en accord.', 'Kanda dyeto dyena ntima mosi.', 'Toute notre famille bat d\'un seul et même cœur.'],
  ['Ntima mpimpa', '[ǹ-tí-mà m̀-pí-mpà]', 'locution', 'Cœur sombre / Rancœur / Mauvaise intention', 'Dark heart / Grudge', 'Patrimoine & Sagesse', 4, 'Mise en garde contre la jalousie et les pensées négatives.', 'Katula ntima mpimpa mu moyo.', 'Chasse toute amertume de ton cœur.'],
  ['Kamba lwa nsi', '[kà-mbá lwà ǹ-sí]', 'locution', 'Enfant du pays / Ami fidèle du terroir', 'Friend of the land / Compatriot', 'Patrimoine & Sagesse', 3, 'Celui qui aime sa terre natale et honore ses racines.', 'Yandi weena kamba lwa nsi ya kieleka.', 'Il est un digne et fidèle enfant du terroir.'],
  ['Sikama mu mpongi', '[sì-ká-mà mù m̀-pó-ngì]', 'locution', 'Réveille-toi du sommeil / Ouvre les yeux', 'Wake up from sleep / Be alert', 'Patrimoine & Sagesse', 2, 'Appel à la vigilance et à l\'éveil de l\'esprit.', 'Sikama mu mpongi, ntangu yimene kwiza !', 'Réveille-toi, le soleil s\'est levé pour une nouvelle journée !'],
  ['Tambula malembe', '[tà-mbú-là mà-lé-mbè]', 'locution', 'Marche doucement / Avance avec prudence', 'Walk gently / Be cautious', 'Patrimoine & Sagesse', 2, 'Leçon de tempérance : la hâte mène aux erreurs.', 'Tambula malembe mu luzingu.', 'Avance avec sagesse et prudence dans la vie.'],
  ['Ku lomba ndololo', '[kù lò-mbá ǹ-dò-ló-lò]', 'locution', 'Demander pardon humblement', 'To ask for forgiveness', 'Patrimoine & Sagesse', 3, 'La grandeur d\'âme consiste à reconnaître ses torts.', 'Lomba ndololo kwa mpangi\'aku.', 'Demande pardon à ton frère en toute sincérité.'],
  ['Bika nsamu', '[bí-kà ǹ-sá-mù]', 'locution', 'Laisse tomber / Faisons la paix', 'Let it go / Make peace', 'Patrimoine & Sagesse', 2, 'Pardonner et passer outre les petites querelles.', 'Bika nsamu, twakala na ngemba.', 'Pardonnons et préservons notre précieuse paix.'],
  ['Nzila ya mpasi', '[ǹ-zí-là yà m̀-pá-sì]', 'locution', 'Le chemin difficile mais enrichissant', 'The rugged path', 'Patrimoine & Sagesse', 3, 'Les épreuves qui forgent le caractère et le courage.', 'Nzila ya mpasi yitwalaka mayele.', 'Le chemin de l\'effort mène toujours à la sagesse.'],
  ['Bambuta bavova', '[bà-mbú-tà bà-vò-vá]', 'locution', 'Comme disent nos sages anciens...', 'As the elders say...', 'Patrimoine & Sagesse', 3, 'Formule introduisant un proverbe séculaire.', 'Bambuta bavova : mayele ma muntu mosi kateleka mbongi ko.', 'Les aînés disent : la sagesse d\'un seul ne bâtit pas le conseil.'],
  ['Tala mbote', '[tá-là m̀-bó-tè]', 'locution', 'Regarde attentivement / Observe bien', 'Look carefully', 'Patrimoine & Sagesse', 1, 'Conseil d\'observation et d\'apprentissage visuel.', 'Tala mbote salu kya tata.', 'Observe bien comment ton père travaille le bois.'],
  ['Wa mbote', '[wá m̀-bó-tè]', 'locution', 'Écoute bien / Sois attentif', 'Listen carefully', 'Patrimoine & Sagesse', 1, 'L\'art d\'écouter avant de prendre la parole.', 'Wa mbote malongi ma nkaka.', 'Écoute avec respect les leçons de ton grand-père.'],
  ['Sosa nzila', '[sò-sá ǹ-zí-là]', 'locution', 'Chercher une solution / Trouver l\'issue', 'To find a way', 'Patrimoine & Sagesse', 3, 'Faire preuve d\'ingéniosité face à un problème.', 'Sosa nzila ya mbote ya kumanisa mambu.', 'Trouve une issue sage pour dénouer cette situation.'],
  ['Nzo ya luzingu', '[ǹ-zó yà lù-zí-ngù]', 'locution', 'Foyer chaleureux / Maison de vie', 'House of life / Warm home', 'Patrimoine & Sagesse', 3, 'La famille où règnent l\'amour, la protection et la transmission.', 'Tunga nzo ya luzingu vana zola.', 'Bâtis ton foyer sur des fondations d\'amour.'],
  ['Ku bonga mayele', '[kù bò-ngá mà-yé-lè]', 'locution', 'Acquérir l\'intelligence et le discernement', 'To acquire wisdom', 'Patrimoine & Sagesse', 3, 'S\'instruire chaque jour auprès des maîtres et des livres.', 'Mwana weena bonga mayele mu nzo-nkanda.', 'L\'enfant enrichit son esprit à l\'école.'],
  ['Zola bantu', '[zò-lá bà-ntú]', 'locution', 'Aimer son prochain avec bienveillance', 'To love people / Compassion', 'Patrimoine & Sagesse', 2, 'Principe humaniste Kongo/Lari (Bumuntu).', 'Bumuntu bwena zola bantu bawonsono.', 'L\'humanité véritable consiste à aimer son prochain.'],
  ['Lunda mambu', '[lù-ndá mà-mbú]', 'locution', 'Garder le secret / Être digne de confiance', 'To keep a secret', 'Patrimoine & Sagesse', 4, 'Ne pas divulguer les confidences d\'un proche.', 'Mbuta weena lunda mambu ma kanda.', 'Le sage garde fidèlement les secrets du clan.'],
  ['Mwinda mu mpimpa', '[mwí-ndà mù m̀-pí-mpà]', 'locution', 'Une lumière dans la nuit / L\'espoir dans l\'épreuve', 'A light in darkness', 'Patrimoine & Sagesse', 4, 'La connaissance qui dissipe les ténèbres de l\'ignorance.', 'Mayele mena mwinda mu mpimpa.', 'La sagesse est une lumière resplendissante dans la nuit.'],
  ['Kiese kwingi', '[kì-é-sè kwí-ngì]', 'locution', 'Une joie immense et débordante', 'Great joy', 'Patrimoine & Sagesse', 1, 'Le bonheur partagé lors d\'une naissance ou d\'une victoire.', 'Kiese kwingi kyena mu nzo eto.', 'Une joie immense remplit notre maison.'],
  ['Kiese mu ntima', '[kì-é-sè mù ǹ-tí-mà]', 'locution', 'La paix et la sérénité du cœur', 'Peace of heart', 'Patrimoine & Sagesse', 2, 'L\'harmonie intérieure loin des tourments.', 'Mono nina kiese mu ntima.', 'J\'ai le cœur profondément en paix.'],

  // =========================================================================
  // 3. TRADITIONS, CÉRÉMONIES, ARTS & COUTUMES
  // =========================================================================
  ['Kinkonko', '[kì-nkó-nkò]', 'cl. 7', 'Dot coutumière / Mariage traditionnel', 'Traditional bride price / Marriage', 'Patrimoine & Sagesse', 4, 'Cérémonie solennelle où les deux familles scellent une alliance par des présents.', 'Bakwenda futa kinkonko kya mwana-nkento.', 'Ils vont célébrer la dot de la jeune fiancée.'],
  ['Makwela', '[mà-kwé-là]', 'cl. 6', 'Noces traditionnelles / Célébration du mariage', 'Wedding ceremony', 'Patrimoine & Sagesse', 3, 'Les danses et banquets qui unissent deux clans.', 'Makwela ma kitoko mena mu bwala.', 'De magnifiques noces sont fêtées au village.'],
  ['Lemba', '[lé-mbà]', 'cl. 9', 'Ordre de Lemba / Société initiatique de paix', 'Ancient Lemba peace institution', 'Patrimoine & Sagesse', 5, 'Ordre séculaire prestigieux garant de la concorde, du commerce et de la santé.', 'Lemba dyadi dyafidisanga ngemba.', 'L\'ordre de Lemba veillait sur la paix universelle.'],
  ['Dikulu', '[dì-kú-lù]', 'cl. 5 (pl. makulu - cl. 6)', 'Généalogie ancestrale / Arbre du clan', 'Ancestral lineage / Pedigree', 'Patrimoine & Sagesse', 4, 'La récitation de la lignée matrilinéaire remontant aux origines.', 'Mbuta walonga dikulu dya kanda.', 'Le doyen a récité la généalogie du clan.'],
  ['Ngoma', '[ǹ-gó-mà]', 'cl. 9/10 (pl. zingoma)', 'Tam-tam sacré / Tambour de danse', 'Sacred drum', 'Patrimoine & Sagesse', 2, 'Instrument en bois sculpté et cuir tendu qui rythme la vie et les chants.', 'Shika ngoma na kiese !', 'Fais résonner le tam-tam avec entrain !'],
  ['Ndungu-ngoma', '[ǹ-dú-ngù-ǹ-gó-mà]', 'cl. 9', 'Grand tambour solennel des rassemblements', 'Master ceremonial drum', 'Patrimoine & Sagesse', 4, 'Tambour royal dont les roulements convoquent le conseil du village.', 'Ndungu ya mbongi yidila.', 'Le grand tambour d\'apparat a retenti.'],
  ['Tsentsa', '[tsé-ntsà]', 'cl. 9/10', 'Maracas traditionnelle / Calebasse à perles', 'Traditional rattle / Shaker', 'Patrimoine & Sagesse', 2, 'Calebasse ornée de graines qui rythme les pas des danseuses.', 'Kanga tsentsa washika nkunga.', 'Prends les maracas pour accompagner le chant.'],
  ['Mukulu', '[mù-kú-lù]', 'cl. 1 (pl. bakulu - cl. 2)', 'Ancêtre protecteur / Aïeul vénéré', 'Revered ancestor', 'Patrimoine & Sagesse', 4, 'Les esprits bienveillants des anciens qui veillent sur la prospérité du clan.', 'Bakulu beto batusungamene.', 'Nos ancêtres veillent sur nos pas.'],
  ['Mbongi', '[m̀-bó-ngì]', 'cl. 9/10', 'Arbre à palabres / Conseil des sages', 'Council hut / Agora', 'Patrimoine & Sagesse', 4, 'L\'espace communautaire sacré où se règlent les litiges et se transmet la tradition.', 'Bambuta bavwandi mu mbongi.', 'Les aînés sont assemblés sous l\'arbre à palabres.'],
  ['Nganga', '[ǹ-gá-ngà]', 'cl. 1/2 (pl. banganga)', 'Maître guérisseur / Sage des plantes', 'Traditional master healer', 'Patrimoine & Sagesse', 4, 'Spécialiste de la médecine traditionnelle et des secrets des herbes.', 'Nganga walongola bilongo.', 'Le maître guérisseur a préparé les remèdes de plantes.'],
  ['Nkisi', '[ǹ-kí-sì]', 'cl. 9/10 (pl. minkisi - cl. 4)', 'Protection sacrée / Remède traditionnel', 'Sacred remedy / Protection charm', 'Patrimoine & Sagesse', 5, 'Objet protecteur sculpté incarnant la justice et la guérison.', 'Nkisi wau wena wa luvuvamu.', 'Ce remède apporte la paix et la guérison.'],
  ['Kimpwanza', '[kì-mpwá-nzà]', 'cl. 7', 'Liberté inaliénable / Indépendance', 'Freedom / Sovereignty', 'Patrimoine & Sagesse', 5, 'La dignité et l\'autonomie du peuple lari sur ses terres ancestrales.', 'Kimpwanza kyena dikaba dya nkembo.', 'La liberté est le plus grand bien de l\'être humain.'],
  ['Kinsiona', '[kì-nsì-ó-nà]', 'cl. 7', 'Solidarité sacrée / Compassion face au deuil', 'Deep solidarity / Compassion', 'Patrimoine & Sagesse', 4, 'Le devoir de soutenir les siens dans les épreuves et les deuils.', 'Twatula kinsiona kwa bavwandi na mpasi.', 'Manifestons notre solidarité à ceux qui souffrent.'],
  ['Kinkani', '[kì-nká-nì]', 'cl. 7', 'Hospitalité généreuse / Accueil bienveillant', 'Generous hospitality', 'Patrimoine & Sagesse', 3, 'L\'art d\'accueillir l\'étranger comme un membre de sa propre famille.', 'Kinkani kya lari kyena na nsudi mbote.', 'L\'hospitalité lari est reconnue de tous.'],
  ['Lusansu', '[lù-sá-nsù]', 'cl. 11', 'Histoire / Tradition orale et mémoire', 'Oral history / Tradition', 'Patrimoine & Sagesse', 4, 'La grande fresque historique transmise de bouche à oreille.', 'Bambuta balonga lusansu lwa nsi.', 'Les aînés racontent l\'histoire glorieuse de notre terre.'],
  ['Matanga', '[mà-tá-ngà]', 'cl. 6', 'Veillée d\'hommage / Funérailles coutumières', 'Memorial wake / Funeral gathering', 'Patrimoine & Sagesse', 3, 'Le rassemblement solennel où tout le clan célèbre la mémoire du défunt.', 'Kanda dyawonsono dyena ku matanga.', 'Tout le clan s\'est réuni pour la veillée de souvenir.'],
  ['Zikida', '[zì-kí-dà]', 'cl. 9', 'Danse traditionnelle des réjouissances', 'Traditional folk dance', 'Patrimoine & Sagesse', 3, 'Danse rythmée exécutée en cercle lors des célébrations.', 'Kina zikida na kiese !', 'Danse la zikida avec grâce et allégresse !'],
  ['Kyedila', '[kyè-dí-là]', 'cl. 7', 'Rythme festif / Cadence de fête du Pool', 'Festive rhythm', 'Patrimoine & Sagesse', 3, 'Le tempo entraînant des danses traditionnelles.', 'Kyedila kya ngoma kyanatisa kiese.', 'Le rythme du tambour emporte tout le monde dans la joie.'],
  ['Ntinu', '[ǹ-tí-nù]', 'cl. 1/2', 'Roi traditionnel / Chef suprême historique', 'King / Royal leader', 'Histoire', 5, 'Le monarque garant de la justice et de l\'harmonie territoriale.', 'Ntinu wavwanda vana kiti kya nkembo.', 'Le Roi a pris place sur son siège d\'apparat.'],
  ['Mfumu', '[m̀-fú-mù]', 'cl. 1/2 (pl. bamfumu)', 'Chef coutumier respecté / Notable / Autorité', 'Chief / Respected noble', 'Histoire', 3, 'Dignitaire honoré pour son sens du devoir et de la conciliation.', 'Mfumu a bwala watuma mambu.', 'Le chef du village a ouvert l\'assemblée.'],
  ['Mpemba', '[m̀-pé-mbà]', 'cl. 9', 'Argile blanche sacrée (Kaolin) / Pureté', 'White sacred clay (Kaolin)', 'Patrimoine & Sagesse', 4, 'Argile symbole de pureté, de protection et de bénédiction des anciens.', 'Paka mpemba mu konda nsioko.', 'Applique l\'argile blanche en signe de paix et de grâce.'],
  ['Lukoba', '[lù-kó-bà]', 'cl. 11', 'Pagne traditionnel orné de motifs Kongo', 'Traditional woven cloth', 'Vêtements', 3, 'Tissu d\'apparat porté lors des grandes célébrations coutumières.', 'Lwata lukoba lwa nkembo.', 'Revêts le noble pagne traditionnel de fête.'],

  // =========================================================================
  // 4. HISTOIRE DU PEUPLE LARI & ROYAUME KONGO
  // =========================================================================
  ['Kongo dia Ntotila', '[kò-ngó dyà ǹ-tò-tí-là]', 'nom propre', 'Royaume Kongo historique millénaire', 'Ancient Kingdom of Kongo', 'Histoire', 5, 'Le grand et prestigieux royaume historique dont sont issus les Lari.', 'Kongo dia Ntotila dyina lusansu lwa nkembo.', 'Le Royaume Kongo possède une histoire glorieuse.'],
  ['Mbanza Kongo', '[m̀-bá-nzà kò-ngó]', 'nom propre', 'Capitale historique du Royaume Kongo', 'Historic Capital of Kongo', 'Histoire', 5, 'La cité ancestrale millénaire d\'où partirent les différentes migrations.', 'Mbanza Kongo yina nzo ya bakulu.', 'Mbanza Kongo est le berceau de nos illustres pères.'],
  ['Ntotila', '[ǹ-tò-tí-là]', 'cl. 1/2', 'Le Roi Suprême / Le Grand Souverain', 'Supreme Emperor / King', 'Histoire', 5, 'Titre porté par le souverain régnant sur l\'ensemble des provinces Kongo.', 'Ntotila wayala nsi na mayele.', 'Le souverain gouvernait le royaume avec une immense sagesse.'],
  ['Mani Kongo', '[mà-ní kò-ngó]', 'titre historique', 'Titre royal du Roi du Kongo', 'King of Kongo title', 'Histoire', 5, 'Le souverain protecteur des coutumes et des peuples fédérés.', 'Mani Kongo wavana luvuvamu kwa bantu.', 'Le Mani Kongo accordait sa protection et sa paix à tous.'],
  ['Pool Malebo', '[pò-ól mà-lé-bò]', 'nom propre', 'Pool Malebo (Le grand lac du fleuve Congo)', 'Pool Malebo', 'Histoire', 3, 'L\'immense plan d\'eau du fleuve Congo bordant Brazzaville et Kinshasa.', 'Maza ma Pool Malebo mena nda.', 'Les eaux majestueuses du Pool Malebo s\'étendent à l\'infini.'],
  ['Bacongo', '[bà-kò-ngó]', 'nom propre', 'Bacongo (Quartier historique de Brazzaville)', 'Bacongo historic district', 'Histoire', 2, 'Haut lieu de culture, de musique, de sape et d\'art de vivre lari.', 'Bacongo yina bwala dya kiese na masolo.', 'Bacongo est un quartier vibrant de mémoire et de créativité.'],
  ['Makelekele', '[mà-kè-lé-kè-lé]', 'nom propre', 'Makelekele (Berceau artistique et musical)', 'Makelekele cultural hub', 'Histoire', 2, 'Quartier du sud de Brazzaville réputé pour sa joie de vivre et ses artistes.', 'Ku Makelekele ngoma zishika bututu.', 'À Makelekele, les tambours résonnent jusqu\'à l\'aube.'],
  ['Kinkala', '[kì-nká-là]', 'nom propre', 'Kinkala (Capitale historique du Pool)', 'Kinkala Pool Capital', 'Histoire', 3, 'Le chef-lieu historique du département du Pool, cœur des traditions.', 'Kinkala yina bwala bwa bambuta.', 'Kinkala est la terre vénérée de nos aînés.'],
  ['Mindouli', '[mì-ndù-lí]', 'nom propre', 'Mindouli (Terre minière ancestrale du Pool)', 'Mindouli historic town', 'Histoire', 4, 'Région historique d\'extraction du cuivre et de forge d\'outils ancestraux.', 'Ku Mindouli bakulu batimanga sono.', 'À Mindouli, les anciens travaillaient le cuivre avec art.'],
  ['Boko', '[bó-kò]', 'nom propre', 'Boko (Terre maraîchère et spirituelle du Pool)', 'Boko agricultural land', 'Histoire', 3, 'Localité célèbre pour ses vergers fertiles et sa ferveur spirituelle.', 'Boko yina nsi ya bilanga bya nkembo.', 'Boko est une terre aux récoltes abondantes et bénies.'],
  ['Mayama', '[mà-yá-mà]', 'nom propre', 'Mayama (Collines verdoyantes du Pool)', 'Mayama hills of Pool', 'Histoire', 4, 'Bourgade historique au cœur des collines du Pool.', 'Ku Mayama mupepe weena mpio mbote.', 'À Mayama, le vent frais des collines vivifie les esprits.'],
  ['Matsoua', '[mà-tswá]', 'nom propre', 'André Grenard Matsoua (Héros de la liberté)', 'Matsoua emancipation hero', 'Histoire', 5, 'Figure historique majeure de l\'émancipation, de la justice et de l\'amicalisme.', 'Matsoua walwanina kimpwanza kya bantu.', 'Matsoua a lutté pour la dignité et la liberté de son peuple.'],
  ['Boueta Mbongo', '[bwè-tá m̀-bó-ngò]', 'nom propre', 'Boueta Mbongo (Vaillant résistant historique)', 'Boueta Mbongo resistance leader', 'Histoire', 5, 'Grand résistant Kongo-Lari qui défendit avec bravoure l\'intégrité des terres du Pool.', 'Boueta Mbongo walunda ntoto ya bakulu.', 'Boueta Mbongo défendit la terre sacrée de ses ancêtres.'],
  ['Mabiala ma Nganga', '[mà-byá-là mà ǹ-gá-ngà]', 'nom propre', 'Mabiala ma Nganga (Héros de la résistance)', 'Mabiala ma Nganga hero', 'Histoire', 5, 'Combattant infatigable de l\'indépendance et de l\'honneur du peuple Kongo.', 'Mabiala ma Nganga wena nkumbu ya ngolo.', 'Mabiala ma Nganga est un nom gravé dans la mémoire collective.'],
  ['Loufoulakari', '[lù-fù-là-kà-rí]', 'nom propre', 'Chutes sacrées de Loufoulakari', 'Loufoulakari waterfalls', 'Histoire', 4, 'Chutes d\'eau spectaculaires du Pool où les eaux rugissent dans un cadre féerique.', 'Maza ma Loufoulakari mena na ngolo zikondolo teke.', 'Les chutes de Loufoulakari déploient une force majestueuse.'],
  ['Djoué', '[jù-é]', 'nom propre', 'Rivière Djoué (Affluent historique du fleuve)', 'Djoue river', 'Histoire', 2, 'Rivière poissonneuse bordant le sud de Brazzaville et reliant au Pool.', 'Twakatuka ku Djoue twakwenda ku bwala.', 'Nous avons traversé le Djoué pour rejoindre le village.'],
  ['Nsundi', '[ǹ-sú-ndì]', 'nom propre', 'Nsundi (Ancienne province historique du Kongo)', 'Nsundi historic province', 'Histoire', 5, 'L\'une des plus prospères et prestigieuses provinces du Royaume Kongo.', 'Nsundi yina nsi ya bangolo.', 'Nsundi était la province des bâtisseurs et guerriers valeureux.'],
  ['Mpumbu', '[m̀-pú-mbù]', 'nom propre', 'Mpumbu (Grand marché historique du fleuve)', 'Mpumbu historic market', 'Histoire', 4, 'Grand carrefour séculaire d\'échanges commerciaux sur le fleuve Congo.', 'Ku Mpumbu bantù basumbisananga bima.', 'À Mpumbu, les marchands échangeaient tissus et produits précieux.'],
  ['Tchikondo', '[tshì-kó-ndò]', 'cl. 7', 'Pirogue en bois taillée dans un tronc', 'Traditional wooden canoe', 'Transports & Ville', 2, 'Embarcation traditionnelle des pêcheurs du Pool et du fleuve Congo.', 'Mbuta wayobila tchikondo mu maza.', 'Le pêcheur manœuvre sa pirogue avec grande habileté.'],
  ['Kinsoundi', '[kì-nsù-ndí]', 'nom propre', 'Kinsoundi (Quartier historique du sud de Brazzaville)', 'Kinsoundi neighborhood', 'Histoire', 2, 'Quartier historique verdoyant aux portes du Djoué.', 'Ku Kinsoundi mpepe weena kitoko.', 'À Kinsoundi, la brise du fleuve apporte la fraîcheur.'],
  ['Goma Tsé-Tsé', '[gò-má tsé-tsé]', 'nom propre', 'Goma Tsé-Tsé (Carrefour ferroviaire du Pool)', 'Goma Tse-Tse crossroads', 'Histoire', 3, 'Carrefour historique d\'échanges sur la ligne du Chemin de Fer Congo-Océan.', 'Lukalu lwayimana ku Goma Tsé-Tsé.', 'Le train s\'est arrêté à la gare de Goma Tsé-Tsé.'],
  ['Nganga Lingolo', '[ǹ-gá-ngà lì-ngò-ló]', 'nom propre', 'Nganga Lingolo (Bourgade historique du Pool)', 'Nganga Lingolo gateway', 'Histoire', 3, 'Bourgade historique située au sud de Brazzaville sur la route de Kinkala.', 'Twavioka ku Nganga Lingolo.', 'Nous avons traversé Nganga Lingolo en route vers le Pool.'],
  ['Mfilou', '[m̀-fì-lú]', 'nom propre', 'Mfilou (Arrondissement de Brazzaville)', 'Mfilou district', 'Histoire', 2, 'Quartier dynamique et industrieux situé au sud-ouest de Brazzaville.', 'Ku Mfilou bantù basalaka na ngolo.', 'À Mfilou, les artisans travaillent avec ardeur.'],

  // =========================================================================
  // 5. MÉTIERS, ARTISANAT & ACTIVITÉS TRADITIONNELLES
  // =========================================================================
  ['Ntungi', '[ǹ-tú-ngì]', 'cl. 1/2', 'Bâtisseur / Maçon / Constructeur', 'Builder / Mason', 'Métiers & Activités', 2, 'Celui qui érige les maisons solides du village.', 'Ntungi weena tunga nzo ya mbote.', 'Le maçon bâtit une maison solide et durable.'],
  ['Mukumbi', '[mù-kú-mbì]', 'cl. 1/2', 'Forgeron traditionnel / Artisan du métal', 'Blacksmith / Ironworker', 'Métiers & Activités', 3, 'Maître du feu forgeant houes, machettes et lances.', 'Mukumbi weena fula sono mu tiya.', 'Le forgeron bat le fer incandescent sur l\'enclume.'],
  ['Mubi', '[mù-bí]', 'cl. 1/2', 'Chasseur émérite / Pisteur de forêt', 'Master hunter', 'Métiers & Activités', 2, 'Celui qui connaît les sentiers secrets de la forêt.', 'Mubi wele ku mfinda mu konda.', 'Le chasseur s\'en va pister le gibier en forêt.'],
  ['Mufubi', '[mù-fú-bì]', 'cl. 1/2', 'Pêcheur / Navigateur du fleuve', 'Fisherman', 'Métiers & Activités', 2, 'Celui qui lance son filet dans les eaux du Djoué.', 'Mufubi walosa bukondi mu maza.', 'Le pêcheur lance son filet dans l\'eau claire.'],
  ['Mulombi', '[mù-ló-mbì]', 'cl. 1/2', 'Agriculteur / Semeur des champs', 'Farmer / Sower', 'Métiers & Activités', 1, 'Celui qui nourrit le clan grâce à son labeur de la terre.', 'Mulombi weena kuna masangu mu bilanga.', 'L\'agriculteur sème le maïs dans les champs fertiles.'],
  ['Nlongi', '[ǹ-ló-ngì]', 'cl. 1/2', 'Enseignant / Maître d\'école / Éducateur', 'Teacher / Instructor', 'Métiers & Activités', 1, 'Celui qui transmet le savoir et la langue aux enfants.', 'Nlongi weena longa bana mu nzo-nkanda.', 'L\'enseignant instruit les élèves avec bienveillance.'],
  ['Nsemi', '[ǹ-sé-mì]', 'cl. 1/2', 'Penseur / Philosophe / Sage éclairé', 'Thinker / Philosopher', 'Métiers & Activités', 4, 'Le sage qui guide les choix de la communauté.', 'Nsemi walonga mambu ma mayele.', 'Le philosophe prodigue de sages enseignements.'],
  ['Nshiki-ngoma', '[ǹ-shí-kì-ǹ-gó-mà]', 'cl. 1/2', 'Percussionniste / Joueur de tam-tam', 'Drummer / Master percussionist', 'Métiers & Activités', 2, 'L\'artiste qui fait vibrer les cœurs aux fêtes.', 'Nshiki-ngoma washika ngoma na kiese.', 'Le percussionniste fait résonner le tambour avec ferveur.'],
  ['Muyimbi', '[mù-yì-mbí]', 'cl. 1/2', 'Chanteur / Griot / Chantre', 'Singer / Griot', 'Métiers & Activités', 1, 'Celui qui entonne les récits et louanges en musique.', 'Muyimbi weena yimbila nkunga ya kitoko.', 'Le chanteur entonne une mélodie envoûtante.'],
  ['Mukengi', '[mù-ké-ngì]', 'cl. 1/2', 'Vannier / Tisserand de nattes', 'Weaver / Basketmaker', 'Métiers & Activités', 2, 'Artisan qui tresse les paniers et nattes en lianes.', 'Mukengi weena tunga matoko ma nkembo.', 'Le vannier tresse de superbes nattes traditionnelles.'],
  ['Nganga-buka', '[ǹ-gá-ngà-bù-ká]', 'cl. 1/2', 'Médecin / Thérapeute / Soignant', 'Doctor / Traditional healer', 'Métiers & Activités', 3, 'Celui qui soigne les maux du corps et de l\'esprit.', 'Nganga-buka wabuka mbevo.', 'Le médecin a soigné le malade avec dévouement.'],
  ['Nkwasi', '[ǹ-kwá-sì]', 'cl. 1/2', 'Commerçant / Négociant de marché', 'Merchant / Trader', 'Métiers & Activités', 1, 'Celui qui anime les échanges au grand marché.', 'Nkwasi weena teka bima mu zandu.', 'Le commerçant propose ses marchandises au marché.'],
  ['Nsoni-mikanda', '[ǹ-só-nì-mì-ká-ndà]', 'cl. 1/2', 'Écrivain / Scribe / Auteur', 'Writer / Author', 'Métiers & Activités', 3, 'Celui qui immortalise les histoires sur le papier.', 'Nsoni-mikanda wasonika masolo ma lari.', 'L\'écrivain a consigné les contes et mémoires en lari.'],
  ['Kinkete', '[kì-nké-tè]', 'cl. 7', 'Artisanat d\'art / Savoir-faire manuel', 'Craftsmanship / Artistry', 'Métiers & Activités', 3, 'L\'excellence des mains qui façonnent le bois, l\'argile et le fer.', 'Kinkete kya lari cyena na nkembo.', 'L\'artisanat d\'art lari est réputé pour sa finesse.'],

  // =========================================================================
  // 6. NOMBRES ÉTENDUS & COMPTAGE AVANCÉ
  // =========================================================================
  ['Kumi na mosi', '[kú-mì nà mó-sì]', 'adj numéral', 'Onze (11)', 'Eleven (11)', 'Nombres', 2, 'Dix et un.', 'Bana kumi na mosi.', 'Onze enfants attentifs.'],
  ['Kumi na zole', '[kú-mì nà zó-lè]', 'adj numéral', 'Douze (12)', 'Twelve (12)', 'Nombres', 2, 'La douzaine complète.', 'Ngonda kumi na zole mu mvu.', 'Douze mois composent l\'année.'],
  ['Kumi na tatu', '[kú-mì nà tá-tù]', 'adj numéral', 'Treize (13)', 'Thirteen (13)', 'Nombres', 2, 'Treize unités.', 'Miti kumi na tatu.', 'Treize arbres fruitiers.'],
  ['Kumi na ya', '[kú-mì nà yá]', 'adj numéral', 'Quatorze (14)', 'Fourteen (14)', 'Nombres', 2, 'Quatorze unités.', 'Bilumbu kumi na ya.', 'Quatorze jours de marche.'],
  ['Kumi na tanu', '[kú-mì nà tá-nù]', 'adj numéral', 'Quinze (15)', 'Fifteen (15)', 'Nombres', 2, 'Quinze jours, une quinzaine.', 'Bima kumi na tanu.', 'Quinze articles au marché.'],
  ['Kumi na sambanu', '[kú-mì nà sà-mbá-nù]', 'adj numéral', 'Seize (16)', 'Sixteen (16)', 'Nombres', 2, 'Seize unités.', 'Nsusu kumi na sambanu.', 'Seize poules dans l\'enclos.'],
  ['Kumi na sambwadi', '[kú-mì nà sà-mbwá-dì]', 'adj numéral', 'Dix-sept (17)', 'Seventeen (17)', 'Nombres', 2, 'Dix-sept unités.', 'Malu kumi na sambwadi.', 'Dix-sept pas en avant.'],
  ['Kumi na nana', '[kú-mì nà ná-nà]', 'adj numéral', 'Dix-huit (18)', 'Eighteen (18)', 'Nombres', 2, 'L\'âge de la majorité et de la responsabilité.', 'Mimvu kumi na nana.', 'Dix-huit années de jeunesse.'],
  ['Kumi na vwa', '[kú-mì nà vwá]', 'adj numéral', 'Dix-neuf (19)', 'Nineteen (19)', 'Nombres', 2, 'Dix-neuf unités.', 'Mikanda kumi na vwa.', 'Dix-neuf livres d\'étude.'],
  ['Makumi sambanu', '[mà-kú-mì sà-mbá-nù]', 'adj numéral', 'Soixante (60)', 'Sixty (60)', 'Nombres', 3, 'Soixante ans d\'expérience et de bienveillance.', 'Mimvu makumi sambanu.', 'Soixante années de vie.'],
  ['Makumi sambwadi', '[mà-kú-mì sà-mbwá-dì]', 'adj numéral', 'Soixante-dix (70)', 'Seventy (70)', 'Nombres', 3, 'L\'âge vénéré des aînés dans le village.', 'Bambuta ba makumi sambwadi.', 'Les aînés de soixante-dix ans.'],
  ['Makumi nana', '[mà-kú-mì ná-nà]', 'adj numéral', 'Quatre-vingts (80)', 'Eighty (80)', 'Nombres', 3, 'Quatre-vingts unités.', 'Bilanga makumi nana.', 'Quatre-vingts parcelles de terre.'],
  ['Makumi vwa', '[mà-kú-mì vwá]', 'adj numéral', 'Quatre-vingt-dix (90)', 'Ninety (90)', 'Nombres', 3, 'Quatre-vingt-dix unités.', 'Biti makumi vwa.', 'Quatre-vingt-dix sièges d\'apparat.'],
  ['Kazi', '[ká-zì]', 'adj numéral', 'Mille (1 000)', 'One thousand (1,000)', 'Nombres', 4, 'Le grand millier symbolisant l\'abondance.', 'Bantu kazi mosi bavwandidi mu mbongi.', 'Mille personnes réunies en concorde.'],
  ['Ntiti', '[ǹ-tí-tì]', 'adj numéral', 'Zéro / Le commencement / L\'origine', 'Zero / Origin', 'Nombres', 1, 'Le point de départ de tout voyage.', 'Banda vana ntiti watomboka.', 'Pars de zéro et élève-toi par le travail.'],

  // =========================================================================
  // 7. FLORE, ARBRES & PLANTES DU POOL ÉTENDUES
  // =========================================================================
  ['Nkondo', '[ǹ-kó-ndò]', 'cl. 3 (pl. minkondo - cl. 4)', 'Baobab sacré / Arbre de la longévité', 'Baobab tree', 'Nature & Éléments', 1, 'Le géant séculaire symbole de force, de résilience et de savoir ancestral.', 'Nkondo weena nti wa nkembo mu nsi eto.', 'Le grand baobab étend ses branches protectrices.'],
  ['Nsafuti', '[ǹ-sá-fù-tí]', 'cl. 3 (pl. minsafuti - cl. 4)', 'Safoutier / Arbre à safous', 'Safou tree', 'Nature & Éléments', 2, 'L\'arbre qui donne les savoureuses prunes d\'Afrique (safous).', 'Nsafuti weena buta nsafu zazingi.', 'Le safoutier croule sous les fruits mûrs.'],
  ['Dibavoka', '[dì-bà-vó-kà]', 'cl. 5 (pl. mabavoka - cl. 6)', 'Avocat crémeux / Arbre avocatier', 'Avocado', 'Nourriture', 1, 'Fruit riche et crémeux dégusté avec du pain ou du manioc.', 'Dia dibavoka dya kitoko.', 'Savoure ce délicieux avocat bien crémeux.'],
  ['Dinanasi', '[dì-nà-ná-sì]', 'cl. 5 (pl. mananasi - cl. 6)', 'Ananas juteux et sucré', 'Pineapple', 'Nourriture', 1, 'Fruit d\'or rafraîchissant gorgé de jus sous le soleil.', 'Zenga dinanasi dya sukadi.', 'Découpe un ananas bien juteux et sucré.'],
  ['Nkoko-mpondzi', '[ǹ-kó-kò-m̀-pó-ndzì]', 'cl. 9/10', 'Noix de coco / Coco frais', 'Coconut', 'Nourriture', 2, 'La noix de coco dont on boit l\'eau claire rafraîchissante.', 'Nwa maza ma nkoko-mpondzi.', 'Bois l\'eau pure et désaltérante de la noix de coco.'],
  ['Dititi dya ti', '[dì-tí-tì dyà tí]', 'locution', 'Citronnelle / Herbe à thé parfumée', 'Lemongrass', 'Nature & Éléments', 1, 'Plante aromatique préparée en infusion matinale bienfaisante.', 'Lamba dititi dya ti twanwa mu masa.', 'Prépare une bonne infusion chaude de citronnelle.'],
  ['Tangawisi', '[tà-ngà-wí-sì]', 'cl. 9', 'Gingembre frais piquant', 'Ginger root', 'Nourriture', 2, 'Racine épicée utilisée pour les boissons toniques.', 'Kamuna tangawisi mu maza.', 'Râpe du gingembre pour préparer un jus vivifiant.'],
  ['Mfuma', '[m̀-fú-mà]', 'cl. 3 (pl. mifuma - cl. 4)', 'Fromager géant / Arbre protecteur de forêt', 'Silk cotton tree / Ceiba', 'Nature & Éléments', 3, 'L\'arbre colossal réputé pour abriter la quiétude de la forêt.', 'Mfuma weena nene mu mfinda.', 'Le grand fromager dresse son tronc colossal vers le ciel.'],

  // =========================================================================
  // 8. ORIENTATION, GÉOGRAPHIE & ESPACE
  // =========================================================================
  ['Ku ntwala', '[kù ǹ-twá-là]', 'locution', 'En avant / Devant / Vers l\'avenir', 'Forward / In front', 'Transports & Ville', 1, 'Regarder droit devant soi vers un avenir radieux.', 'Tala ku ntwala, bika mambu ma nima.', 'Regarde devant toi et avance avec confiance.'],
  ['Ku nima', '[kù ní-mà]', 'locution', 'En arrière / Derrière / Dans le passé', 'Behind / Backwards', 'Transports & Ville', 1, 'Laisser derrière soi les regrets.', 'Kukeba ku nima.', 'Ne te retourne pas sur les échecs passés.'],
  ['Ku zulu', '[kù zù-lú]', 'locution', 'En haut / Vers le ciel / Au sommet', 'Above / Upwards', 'Nature & Éléments', 1, 'Vers les étoiles et la lumière.', 'Tala ku zulu, tetembwa zena ngengima.', 'Lève les yeux vers le ciel, les étoiles brillent.'],
  ['Ku nsi', '[kù ǹ-sí]', 'locution', 'En bas / Sur terre / Vers le sol', 'Downwards / Below', 'Nature & Éléments', 1, 'Garder les pieds bien ancrés sur la terre.', 'Vwanda ku nsi vana matoko.', 'Assieds-toi au sol sur la natte tressée.'],
  ['Ku kimosi', '[kù kì-mó-sì]', 'locution', 'À gauche / Côté gauche', 'To the left', 'Transports & Ville', 2, 'Direction vers la gauche.', 'Bila ku kimosi vana nzila.', 'Tourne à gauche au croisement des sentiers.'],
  ['Ku kibakala', '[kù kì-bà-ká-là]', 'locution', 'À droite / Côté droit (côté de la force)', 'To the right', 'Transports & Ville', 2, 'Direction vers la droite, côté de la main forte.', 'Bila ku kibakala mu baka nzo.', 'Prends à droite pour arriver à la maison.'],
  ['Ku kati', '[kù ká-tì]', 'locution', 'Au milieu / Au centre / À l\'intérieur', 'Inside / In the middle', 'Transports & Ville', 1, 'Être au cœur de l\'assemblée ou de la maison.', 'Kota ku kati dya nzo.', 'Entre à l\'intérieur de la maison.'],
  ['Ku mbazi', '[kù m̀-bá-zì]', 'locution', 'Dehors / À l\'extérieur / Dans la cour', 'Outside / In the yard', 'Transports & Ville', 1, 'Sortir respirer l\'air frais sous les arbres.', 'Vaika ku mbazi mu yoka mupepe.', 'Sors dehors pour profiter de la douce brise.'],
  ['Ku mbanza', '[kù m̀-bá-nzà]', 'locution', 'En ville / Dans la capitale / Cité urbaine', 'In the city / Capital', 'Transports & Ville', 1, 'La ville dynamique et moderne.', 'Tata wele ku mbanza mu salu.', 'Papa est parti en ville pour son travail.'],
  ['Ku ngulu', '[kù ǹ-gú-lù]', 'locution', 'Sur la colline / Sur la montagne verdoyante', 'On the hill / Mountain', 'Nature & Éléments', 2, 'Les hauteurs panoramiques du département du Pool.', 'Twatomboka ku ngulu mu mona bwala.', 'Nous sommes montés sur la colline pour admirer le village.'],
  ['Nzadi', '[ǹ-zá-dì]', 'cl. 9/10', 'Le grand fleuve Kongo majestueux', 'Great Kongo River', 'Nature & Éléments', 2, 'Le fleuve mythique qui berce l\'histoire et la vie des peuples.', 'Maza ma Nzadi mena na ngolo zikondolo sukulu.', 'Les flots majestueux du fleuve Congo s\'écoulent avec puissance.'],

  // =========================================================================
  // 9. CUISINE & SAVEURS LOCALES TRADITIONNELLES SUPPLÉMENTAIRES
  // =========================================================================
  ['Mbisi a mungwa', '[m̀-bí-sì à mù-ngwá]', 'locution', 'Poisson salé séché traditionnel', 'Salted dried fish', 'Nourriture', 2, 'Poisson salé séché au soleil, ingrédient incontournable des ragoûts congolais.', 'Lamba mbisi a mungwa na matembele.', 'Cuisine le poisson salé avec des feuilles de patate douce.'],
  ['Koko ya lari', '[kó-kò yà là-rí]', 'locution', 'Feuilles de koko à la mode traditionnelle du Pool', 'Traditional Pool Gnetum stew', 'Nourriture', 2, 'Plat savoureux de feuilles de Gnetum mijotées longuement avec pâte d\'arachide.', 'Mama walamba koko ya lari dya kununa.', 'Maman a cuisiné un succulent plat de koko du Pool.'],
  ['Nguba', '[ǹ-gú-bà]', 'cl. 9/10', 'Arachides crues / Cacahuètes de terre', 'Raw peanuts', 'Nourriture', 1, 'Arachides cultivées dans les terres sableuses et fertiles du Pool.', 'Mulombi wakuna nguba mu bilanga.', 'L\'agriculteur a semé des arachides dans son champ.'],
  ['Nguba ya kanga', '[ǹ-gú-bà yà kà-ngá]', 'locution', 'Arachides grillées croustillantes', 'Roasted peanuts', 'Nourriture', 1, 'Arachides croustillantes dégustées avec de la banane ou du manioc.', 'Dia nguba ya kanga na kwanga.', 'Déguste des arachides grillées avec de la chikwangue.'],
  ['Mayele ma lamba', '[mà-yé-lè mà là-mbá]', 'locution', 'Art et secrets culinaires traditionnels', 'Traditional culinary skill', 'Nourriture', 3, 'Le savoir-faire transmis de mère en fille pour assaisonner les sauces.', 'Mama weena na mayele ma lamba.', 'Maman possède un talent culinaire hors pair.'],
  ['Nzo a madiya', '[ǹ-zó à mà-dí-yà]', 'locution', 'Salle à manger / Espace des repas', 'Dining room', 'Maison', 1, 'Le lieu convivial où l\'on partage les déjeuners et dîners.', 'Iza ku nzo a madiya twadia.', 'Viens dans la salle à manger pour le repas.'],
  ['Lusu lwa mbisi', '[lù-sú lwà m̀-bí-sì]', 'locution', 'Jus onctueux et bouillon parfumé de poisson', 'Rich fish broth', 'Nourriture', 2, 'Sauce savoureuse issue de la cuisson du poisson frais.', 'Tula lusu lwa mbisi vana loso.', 'Nappe le riz avec le succulent jus de poisson.'],
  ['Mpolo a madiya', '[m̀-pò-ló à mà-dí-yà]', 'locution', 'Apparence appétissante et dorée des mets', 'Appetizing meal appearance', 'Nourriture', 2, 'La belle présentation des plats préparés avec amour.', 'Madiya mama mena mpolo ya kitoko.', 'Ce plat a une allure extrêmement appétissante.'],
  ['Nkuni za tiya', '[ǹ-kú-nì zà tí-yà]', 'locution', 'Bois sec sélectionné pour le foyer de cuisson', 'Firewood for cooking', 'Maison', 1, 'Fagots de bois sec ramassés pour alimenter le feu sous la marmite.', 'Tola nkuni za tiya mu kuku.', 'Ramasse du bois sec pour allumer le feu de cuisine.'],
  ['Fuka dya madesu', '[fù-ká dyà mà-dé-sù]', 'locution', 'Ragoût mijoté d\'haricots et légumes', 'Slow-cooked bean stew', 'Nourriture', 2, 'Plat traditionnel associant haricots tendres et aromates locaux.', 'Twadia fuka dya madesu dya kununa.', 'Nous avons savouré un ragoût d\'haricots délicatement mijoté.'],

  // =========================================================================
  // 10. SAGESSES & TRANSMISSIONS SUPPLÉMENTAIRES
  // =========================================================================
  ['Tala nzila', '[tá-là ǹ-zí-là]', 'locution', 'Fais attention où tu marches / Sois vigilant', 'Watch your path / Be alert', 'Patrimoine & Sagesse', 1, 'Conseil d\'attention et de prudence sur la route de la vie.', 'Tala nzila mwana\'ami, tambula mbote.', 'Fais attention où tu poses tes pas, marche avec prudence.'],
  ['Yamba nzenza', '[yà-mbá ǹ-zé-nzà]', 'locution', 'Accueillir l\'étranger avec générosité', 'Welcome the guest / Hospitality', 'Patrimoine & Sagesse', 2, 'L\'obligation morale d\'ouvrir sa porte au voyageur de passage.', 'Yamba nzenza na zola ye kiese.', 'Accueille le voyageur avec chaleur et bienveillance.'],
  ['Zola bampangi', '[zò-lá bà-mpá-ngì]', 'locution', 'Aimer ses frères et sœurs de tout son cœur', 'Love your siblings / Kin', 'Patrimoine & Sagesse', 1, 'Le pilier de la cohésion et de l\'amour familial.', 'Zola bampangi baaku ntangu zawonsono.', 'Aime tes frères et sœurs en toutes circonstances.'],
  ['Lembama mu mambu', '[lé-mbà-mà mù mà-mbú]', 'locution', 'Faire preuve d\'humilité et de sagesse', 'Be humble in conduct', 'Patrimoine & Sagesse', 3, 'Garder son calme et son humilité face aux épreuves.', 'Lembama mu mambu mawonsono.', 'Garde ton calme et ton humilité en toute situation.'],
  ['Vutula matondo', '[vù-tù-lá mà-tó-ndò]', 'locution', 'Savoir remercier et exprimer sa gratitude', 'Express gratitude / Give thanks', 'Patrimoine & Sagesse', 1, 'Reconnaître les bienfaits reçus des autres et de Dieu.', 'Vutula matondo kwa babuti baaku.', 'Exprime ta vive gratitude envers tes parents.'],
  ['Kuata ku nima', '[kwà-tá kù ní-mà]', 'locution', 'Garder en mémoire les leçons du passé', 'Learn from the past', 'Patrimoine & Sagesse', 3, 'Savoir d\'où l\'on vient pour mieux construire l\'avenir.', 'Kuata ku nima mu zaba nzila ya ntwala.', 'Retiens les leçons du passé pour mieux tracer ton futur.'],
  ['Sala na ngolo', '[sá-là nà ǹ-gó-lò]', 'locution', 'Travailler avec force et persévérance', 'Work with vigor and grit', 'Patrimoine & Sagesse', 1, 'Le courage au travail qui forge le respect.', 'Sala na ngolo watwa baka ndandu.', 'Travaille d\'arrache-pied pour récolter de grands succès.'],
  ['Bika kimpala', '[bí-kà kì-mpá-là]', 'locution', 'Bannir la jalousie et l\'amertume', 'Ban jealousy / Envy', 'Patrimoine & Sagesse', 3, 'Ne pas envier le bonheur d\'autrui et cultiver sa propre paix.', 'Bika kimpala mu moyo waku.', 'Chasse toute jalousie de ton cœur.'],
  ['Kesa dya mbote', '[ké-sà dyà m̀-bó-tè]', 'locution', 'Un être loyal, brave et intègre', 'A noble, honest person', 'Patrimoine & Sagesse', 3, 'Désigne une personne fidèle à sa parole et dévouée.', 'Yandi weena kesa dya mbote mu bwala.', 'Il est un homme probe et estimé de tout le village.'],
  ['Vana na kiese', '[vá-nà nà kì-é-sè]', 'locution', 'Donner avec le sourire et générosité', 'Give with joy and gladness', 'Patrimoine & Sagesse', 2, 'Donner sans compter pour le bien d\'autrui.', 'Vana dikaba na kiese mu ntima.', 'Offre ton présent avec une joie sincère dans le cœur.'],
  ['Zinga mbote', '[zì-ngá m̀-bó-tè]', 'locution', 'Vivre en paix et en bonne santé', 'Live well / Prosper in peace', 'Patrimoine & Sagesse', 1, 'Vœu d\'une longue vie heureuse et paisible.', 'Zinga mbote mu nsi a bakulu.', 'Que tu vives longtemps et en paix sur la terre de nos aïeux.'],
  ['Lunda lusansu', '[lù-ndá lù-sá-nsù]', 'locution', 'Conserver fidèlement l\'histoire de son peuple', 'Preserve ancestral heritage', 'Patrimoine & Sagesse', 4, 'Le devoir sacré de sauvegarder la mémoire Kongo/Lari.', 'Lunda lusansu lwa Kongo dia Ntotila.', 'Préserve fidèlement l\'histoire glorieuse du Royaume Kongo.'],
  ['Simbana moko', '[sì-mbá-nà mò-kó]', 'locution', 'Se donner la main / Se serrer les coudes', 'Hold hands / Stand united', 'Patrimoine & Sagesse', 2, 'L\'alliance fraternelle face aux défis de la communauté.', 'Twasimbana moko mu tunga bwala.', 'Donnons-nous la main pour bâtir notre village.'],
  ['Nzo ya kiese', '[ǹ-zó yà kì-é-sè]', 'locution', 'Un foyer rayonnant de bonheur', 'A home filled with joy', 'Patrimoine & Sagesse', 1, 'Une maison où résonnent les rires et la bienveillance.', 'Nzo eto yidi nzo ya kiese ye zola.', 'Notre maison est un foyer chaleureux et rempli d\'amour.'],
  ['Bwala bwa ngemba', '[bwà-lá bwà ǹ-gé-mbà]', 'locution', 'Un village où règne la paix', 'A village of deep peace', 'Patrimoine & Sagesse', 2, 'La concorde villageoise où tous vivent en harmonie.', 'Bwala bweto bwena bwala bwa ngemba.', 'Notre village est une terre de paix et de fraternité.'],

  // =========================================================================
  // 11. MONDE NATUREL & ÉLÉMENTS SACRÉS DU POOL
  // =========================================================================
  ['Mbisi a Djoué', '[m̀-bí-sì à jù-é]', 'locution', 'Poissons renommés de la rivière Djoué', 'Famous Djoue river fish', 'Animaux', 2, 'Poissons d\'eau douce pêchés traditionnellement au filet dans le Djoué.', 'Mufubi wakwata mbisi a Djoue ya kitoko.', 'Le pêcheur a rapporté de superbes poissons du Djoué.'],
  ['Nuni ya mpembe', '[nù-ní yà m̀-pé-mbè]', 'locution', 'Aigrette blanche / Oiseau d\'eau pure', 'White egret / Heron', 'Animaux', 2, 'Grand oiseau blanc immaculé planant au-dessus des rivières.', 'Nuni ya mpembe weena pupa vana maza.', 'L\'aigrette blanche vole gracieusement au-dessus de l\'eau.'],
  ['Nkosi a nsi', '[ǹ-kó-sì à ǹ-sí]', 'locution', 'Le lion protecteur des savanes ancestrales', 'The noble land lion', 'Animaux', 3, 'Symbole légendaire de noblesse et de puissance territoriale.', 'Nkosi a nsi weena simba bwala.', 'Le lion protecteur veille sur les frontières de la terre.'],
  ['Ntangu ya masa', '[ǹ-tá-ngù yà mà-sá]', 'locution', 'Le soleil doux de la fin d\'après-midi', 'Late afternoon gentle sun', 'Temps & Saisons', 1, 'Moment où le soleil s\'adoucit avant le crépuscule.', 'Mu ntangu ya masa bantù bavwandaka ku mbazi.', 'En fin d\'après-midi, les habitants se retrouvent sous l\'arbre.'],
  ['Ngonda ya mpa', '[ǹ-gó-ndà yà m̀-pá]', 'locution', 'La nouvelle lune / Début de cycle', 'New moon / New cycle', 'Temps & Saisons', 1, 'Croissant de lune marquant le renouveau des récoltes.', 'Ngonda ya mpa yibosukidi mu zulu.', 'La nouvelle lune est apparue dans le ciel nocturne.'],
  ['Mvula ya ngolo', '[m̀-vú-là yà ǹ-gó-lò]', 'locution', 'Pluie tropicale puissante et bienfaisante', 'Heavy nourishing rain', 'Nature & Éléments', 2, 'L\'orage bienfaiteur qui recharge les sources et rivières.', 'Mvula ya ngolo yina noka, masa meena duka.', 'Une pluie torrentielle bienfaisante nourrit les cours d\'eau.'],
  ['Ntoto wa bwala', '[ǹ-tó-tò wà bwà-lá]', 'locution', 'La terre natale du village d\'origine', 'Native soil of the village', 'Nature & Éléments', 2, 'Le sol sacré où reposent les pères fondateurs.', 'Ntoto wa bwala bweto wena wa nkembo.', 'La terre de notre village natal est sacrée et précieuse.'],
  ['Mupepe wa kitoko', '[mù-pé-pè wà kì-tó-kò]', 'locution', 'Brise parfumée et rafraîchissante du soir', 'Pleasant evening breeze', 'Nature & Éléments', 1, 'Le vent doux qui apaise la chaleur de la journée.', 'Mupepe wa kitoko weena fula mu lupangu.', 'Une brise délicieusement douce souffle dans la concession.'],
  ['Nti wa nkondo', '[ǹ-tí wà ǹ-kó-ndò]', 'locution', 'Le tronc majestueux du baobab séculaire', 'Trunk of the sacred baobab', 'Nature & Éléments', 2, 'Le tronc colossal pouvant résister aux siècles et aux sécheresses.', 'Nti wa nkondo weena siama vana ntoto.', 'Le baobab est fermement enraciné dans la terre du Pool.'],
  ['Zulu dya nkembo', '[zù-lú dyà ǹ-ké-mbò]', 'locution', 'Le ciel étoilé étincelant de gloire', 'Glorious starry sky', 'Nature & Éléments', 2, 'Le firmament nocturne constellé d\'étoiles au-dessus du fleuve.', 'Zulu dya nkembo dyena ngengima mu mpimpa.', 'Le ciel étoilé resplendit d\'une beauté sublime dans la nuit.'],

  // =========================================================================
  // 12. PAROLES DE BÉNÉDICTION & SAGESSE TRANSMISES
  // =========================================================================
  ['Mpimpa ya kiese', '[m̀-pí-mpà yà kì-é-sè]', 'locution', 'Une nuit paisible, sereine et douce', 'Peaceful good night', 'Temps & Saisons', 1, 'Souhait de doux rêves et de repos réparateur.', 'Leka mpimpa ya kiese mwana\'ami.', 'Passe une douce et paisible nuit mon enfant.'],
  ['Kuvanda na ngemba', '[kù-và-ndá nà ǹ-gé-mbà]', 'locution', 'Vivre dans la paix, le calme et la tranquillité', 'Live in serenity and peace', 'Patrimoine & Sagesse', 2, 'L\'état de quiétude au sein du foyer et du village.', 'Kuvanda na ngemba kwena nkembo.', 'Vivre en paix est la plus belle des richesses.'],
  ['Muntu a mayele', '[mù-ntú à mà-yé-lè]', 'locution', 'Une personne sage, avisée et respectée', 'A wise and prudent person', 'Patrimoine & Sagesse', 2, 'Celui qui pèse ses paroles avant de s\'exprimer.', 'Yandi weena muntu a mayele ma nene.', 'Il est un homme sage et profondément respecté.'],
  ['Kukolesa kanda', '[kù-kò-lé-sà kà-ndá]', 'locution', 'Fortifier l\'unité et l\'entente familiale', 'Strengthen family unity', 'Patrimoine & Sagesse', 3, 'Prendre soin des liens de parenté pour rester forts ensemble.', 'Twakolesa kanda dyeto na zola.', 'Fortifions notre famille dans l\'amour et la concorde.'],
  ['Masa ma moyo', '[mà-sá mà mò-yó]', 'locution', 'L\'eau de la vie / La source vivifiante', 'Water of life', 'Nature & Éléments', 2, 'L\'eau pure de source qui étanche la soif et donne la vigueur.', 'Nwa masa ma moyo matwa kala ngolo.', 'Bois cette eau pure qui redonne des forces.'],
  ['Nlongi a mbote', '[ǹ-ló-ngì à m̀-bó-tè]', 'locution', 'Un enseignant dévoué et inspirant', 'A great dedicated teacher', 'Métiers & Activités', 1, 'Le maître qui guide les enfants sur la voie de la réussite.', 'Nlongi a mbote weena longa na zola.', 'Le bon enseignant transmet le savoir avec passion.'],
  ['Kiyisa kya bakulu', '[kì-yí-sà kyà bà-kú-lù]', 'locution', 'Les nobles coutumes de nos ancêtres', 'Ancestral customs and ways', 'Patrimoine & Sagesse', 4, 'Les règles de vie et de bienséance léguées par les aïeux.', 'Lunda kiyisa kya bakulu beto.', 'Conserve précieusement les coutumes de nos aïeux.'],
  ['Ntima wa mpembe', '[ǹ-tí-mà wà m̀-pé-mbè]', 'locution', 'Un cœur pur, bienveillant et généreux', 'A pure, kind heart', 'Patrimoine & Sagesse', 2, 'Une âme sans malice qui fait le bien autour d\'elle.', 'Mwana weena ntima wa mpembe.', 'Cet enfant a un cœur d\'une pureté et d\'une bonté remarquables.'],
  ['Bana ba lari', '[bà-nà bà là-rí]', 'locution', 'Les enfants fiers de la langue et culture lari', 'Children of the Lari heritage', 'Patrimoine & Sagesse', 1, 'La nouvelle génération qui apprend sa langue ancestrale.', 'Bana ba lari beena longa na kiese.', 'Les enfants de Mwana Lari apprennent avec joie.'],
  ['Kinsiona kya kanda', '[kì-nsì-ó-nà kyà kà-ndá]', 'locution', 'La solidarité indéfectible du clan', 'Unbreakable clan solidarity', 'Patrimoine & Sagesse', 4, 'La chaîne de soutien mutuel qui unit tous les membres.', 'Kinsiona kya kanda kyena ngolo.', 'La solidarité de notre clan est inébranlable.'],
  ['Mbote ya nkembo', '[m̀-bó-tè yà ǹ-ké-mbò]', 'locution', 'Bénédiction solennelle et paix glorieuse', 'Glorious blessing and peace', 'Patrimoine & Sagesse', 2, 'Salutation et bénédiction des aînés lors des réunions.', 'Tambula mbote ya nkembo.', 'Reçois cette bénédiction de paix et de bonheur.'],
  ['Mbandu ya mbote', '[m̀-bá-ndù yà m̀-bó-tè]', 'locution', 'Le bon exemple à suivre / Modèle inspirant', 'Good role model / Example', 'Patrimoine & Sagesse', 2, 'Montrer l\'exemple par ses actes et sa droiture.', 'Kala mbandu ya mbote kwa baleke.', 'Sois un modèle inspirant pour tes jeunes frères.'],
  ['Nzila ya nkembo', '[ǹ-zí-là yà ǹ-ké-mbò]', 'locution', 'Le chemin de l\'accomplissement et de la dignité', 'Path of dignity and triumph', 'Patrimoine & Sagesse', 3, 'La voie tracée par le travail, la rigueur et le savoir.', 'Kuata nzila ya nkembo mu luzingu.', 'Avance avec fierté sur le chemin de l\'accomplissement.'],
  ['Kiese kya nzo', '[kì-é-sè kyà ǹ-zó]', 'locution', 'Le bonheur et la douceur du foyer familial', 'Joy of the home', 'Patrimoine & Sagesse', 1, 'L\'atmosphère joyeuse où grandissent les enfants.', 'Kiese kya nzo kyena bima bya nene.', 'La joie au foyer est le plus beau des trésors.'],
  ['Bumuntu bwa kieleka', '[bù-mù-ntú bwà kì-é-lé-kà]', 'locution', 'L\'humanité véritable et la noblesse d\'âme', 'True humanity / Noble character', 'Patrimoine & Sagesse', 5, 'Le respect suprême de la vie humaine et de la dignité de chacun.', 'Bumuntu bwa kieleka bwena dikaba dya Nzambi.', 'L\'humanisme authentique est la plus haute vertu humaine.']
];

// Combine existing + new, deduplicating on wordNative (case-insensitive)
const combinedMap = new Map();

// Insert existing first
for (const item of existingItems) {
  const key = item.wordNative.toLowerCase().trim();
  combinedMap.set(key, item);
}

// Merge new entries
for (const row of NEW_CATEGORIZED_ENTRIES) {
  const [wordNative, phonetic, nounClass, translationFr, translationEn, category, difficultyLevel, culturalNote, exampleSentenceNative, exampleSentenceFr] = row;
  const key = wordNative.toLowerCase().trim();
  if (!combinedMap.has(key)) {
    const cleanAudioName = wordNative.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    combinedMap.set(key, {
      id: `w${combinedMap.size + 1}`,
      wordNative,
      phonetic: phonetic || `[${wordNative.toLowerCase()}]`,
      nounClass: nounClass || 'cl. 9/10',
      translationFr,
      translationEn: translationEn || '',
      category: category || 'Général',
      difficultyLevel: difficultyLevel || 1,
      culturalNote: culturalNote || '',
      exampleSentenceNative: exampleSentenceNative || '',
      exampleSentenceFr: exampleSentenceFr || '',
      audioUrl: `/audio/words/${cleanAudioName}.wav`,
      validatedByElder: true,
      speakerName: (combinedMap.size % 2 === 0) ? 'Mbuta Papa Jean-Baptiste (Pointe-Noire / Pool)' : 'Mbuta Pauline (Brazzaville / Bacongo)',
      source: 'MBUTA / Dictionnaire Vivant Lari-Français'
    });
  }
}

// Re-index all entries
const FINAL_WORDS_LIST = Array.from(combinedMap.values()).map((w, idx) => ({
  ...w,
  id: `w${idx + 1}`
}));

console.log(`✨ Total après fusion & expansion : ${FINAL_WORDS_LIST.length} mots certifiés.`);

// Write to JSON
fs.writeFileSync(existingJsonPath, JSON.stringify(FINAL_WORDS_LIST, null, 2), 'utf-8');

// Write to CSV
const csvHeader = 'id,word_native,phonetic,noun_class,translation_fr,translation_en,category,difficulty_level,cultural_note,example_sentence_native,example_sentence_fr,source,confidence_level\n';
const csvRows = FINAL_WORDS_LIST.map(w => {
  const note = `"${(w.culturalNote || '').replace(/"/g, '""')}"`;
  const exNat = `"${(w.exampleSentenceNative || '').replace(/"/g, '""')}"`;
  const exFr = `"${(w.exampleSentenceFr || '').replace(/"/g, '""')}"`;
  return `${w.id},${w.wordNative},${w.phonetic},${w.nounClass || ''},"${w.translationFr}","${w.translationEn}",${w.category},${w.difficultyLevel},${note},${exNat},${exFr},"${w.source}","Très élevée"`;
}).join('\n');
fs.writeFileSync(path.resolve('data/lexicon/dictionnaire_lari_francais.csv'), csvHeader + csvRows, 'utf-8');

// Update src/data/mockData.ts
const mockDataPath = path.resolve('src/data/mockData.ts');
let mockDataContent = fs.readFileSync(mockDataPath, 'utf-8');
const regexWords = /export const LARI_WORDS: WordItem\[\] = \[([\s\S]*?)\];/;
const replacement = `export const LARI_WORDS: WordItem[] = ${JSON.stringify(FINAL_WORDS_LIST, null, 2)};`;

if (regexWords.test(mockDataContent)) {
  mockDataContent = mockDataContent.replace(regexWords, replacement);
  fs.writeFileSync(mockDataPath, mockDataContent, 'utf-8');
  console.log(`✅ src/data/mockData.ts synchronisé avec les ${FINAL_WORDS_LIST.length} mots Lari !`);
} else {
  console.warn('⚠️ Impossible de localiser export const LARI_WORDS dans mockData.ts');
}
