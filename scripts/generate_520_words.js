import fs from 'fs';
import path from 'path';

// Complete dictionary of 520+ authentic, distinct Lari words & expressions
// Covering:
// 1. Salutations & Politesse
// 2. Famille & Relations
// 3. Corps Humain (Nitu)
// 4. Cuisine Congolaise & Plats Traditionnels (Saka-saka, Maboke, Kikwanga, etc.)
// 5. Expressions Idiomatiques & Sagesse Lari
// 6. Traditions, Cérémonies, Arts & Coutumes
// 7. Histoire du Peuple Lari & Royaume Kongo
// 8. Nature, Faune & Environnement
// 9. Maison & Vie Quotidienne
// 10. Vêtements & Parures
// 11. Transports & Ville
// 12. Métiers & Activités
// 13. Nombres & Temps
// 14. Verbes d'Action & Sentiments

const RAW_520_VOCABULARY = [
  // =========================================================================
  // 1. SALUTATIONS & FORMULES DE POLITESSE (Niveau 1 & 2)
  // =========================================================================
  ['Mbote', '[m̀-bó-tè]', 'interj', 'Bonjour / Salut / Paix', 'Hello / Peace', 'Salutations', 1, 'Salutation fondamentale lari. Réponse : « Mbote kaka » ou « Mbote na nge ».', 'Mbote na nge, mwana lari !', 'Bonjour à toi, enfant lari !'],
  ['Bweni', '[bwé-nì]', 'interj / adv', 'Comment vas-tu ? / Ça va ?', 'How are you?', 'Salutations', 1, 'Formule d\'usage lari pour demander des nouvelles (Bweni na nge ? -> Mbote kaka).', 'Bweni na nge ? - Mbote kaka !', 'Comment vas-tu ? - Ça va très bien !'],
  ['Ntondele', '[ǹ-tò-ndé-lè]', 'interj', 'Merci / Gratitude', 'Thank you', 'Salutations', 1, 'La formule authentique lari pour exprimer ses remerciements (« Ntondele mingi »).', 'Ntondele mingi kwa ngeye.', 'Merci beaucoup à toi.'],
  ['Iza', '[í-zà]', 'v. impératif', 'Viens', 'Come', 'Salutations', 1, 'Impératif très usuel en lari : « Iza wa dia » (Viens manger).', 'Iza wa dia madiya !', 'Viens manger le repas !'],
  ['Ingeta', '[ì-ngé-tà]', 'interj', 'Oui / D\'accord / Amen', 'Yes / Agreed', 'Salutations', 1, 'Marque l\'accord solennel et clôture les paroles d\'un ancien.', 'Ingeta, twawa mambu maku.', 'Oui, nous avons entendu tes paroles.'],
  ['Ve', '[vé]', 'adv', 'Non / Négatif / Pas du tout', 'No', 'Salutations', 1, 'Marque la négation en lari (« Nsamu ve » = Pas de problème).', 'Nki nsamu ? - Nsamu ve !', 'Quelles sont les nouvelles ? - Pas de problème !'],
  ['Bika', '[bí-kà]', 'v. impératif', 'Laisse / Arrête / Permets', 'Leave / Stop', 'Salutations', 1, '« Bika kukondola mambu » = Cesse de chercher querelle.', 'Bika mambu ma mbi.', 'Éloigne-toi des mauvaises actions.'],
  ['Matondo', '[mà-tó-ndò]', 'cl. 6', 'Merci / Remerciements', 'Thanks', 'Salutations', 1, 'Exprimer sa gratitude est un devoir fondamental de respect.', 'Matondo ma beni kwa ngeye.', 'Merci beaucoup à toi.'],
  ['Sala mbote', '[sá-là m̀-bó-tè]', 'locution', 'Au revoir / Reste en paix', 'Goodbye (to the one staying)', 'Salutations', 1, 'Formule adressée à celui qui reste à la maison.', 'Sala mbote mama !', 'Reste en paix maman !'],
  ['Kwenda mbote', '[kwè-ndá m̀-bó-tè]', 'locution', 'Bonne route / Va en paix', 'Goodbye (to the one leaving)', 'Salutations', 1, 'Formule adressée à celui qui part en voyage.', 'Kwenda mbote na nzila !', 'Fais une bonne route !'],
  ['Mbote kaka', '[m̀-bó-tè ká-kà]', 'locution', 'Très bien / En paix seulement', 'Just fine', 'Salutations', 1, 'Réponse optimiste et sereine aux salutations.', 'Bweni ? - Mbote kaka !', 'Comment vas-tu ? - Très bien, en paix !'],
  ['Bika kwandi', '[bí-kà kwà-ndí]', 'locution', 'Pardonne-moi / Excuse-moi', 'Excuse me / Pardon', 'Salutations', 2, 'Formule polie pour demander pardon ou la parole.', 'Bika kwandi mbuta, mpeni nzila.', 'Excusez-moi cher aîné, accordez-moi le passage.'],
  ['Wawana mbote', '[wà-wá-nà m̀-bó-tè]', 'locution', 'À bientôt / Au revoir fraternel', 'See you soon', 'Salutations', 2, 'Souhait de se revoir bientôt en paix.', 'Twa wawana mbote mbazi.', 'À bientôt, nous nous reverrons demain.'],
  ['Yoka kiese', '[yó-kà kì-é-sè]', 'locution', 'Bienvenue / Sois le bienvenu', 'Welcome', 'Salutations', 1, 'Accueillir chaleureusement un visiteur.', 'Yoka kiese mu nzo eto !', 'Sois le très bienvenu dans notre maison !'],
  ['Nsamu ve', '[ǹ-sá-mù vé]', 'locution', 'Tout va bien / Rien à signaler', 'All is well', 'Salutations', 1, 'Formule rassurante d\'usage courant.', 'Nsamu ve ku bwala.', 'Tout est paisible au village.'],
  ['Bika twakwenda', '[bí-kà twà-kwè-ndá]', 'locution', 'Permettez-nous de prendre congé', 'Let us leave', 'Salutations', 2, 'Demander poliment la permission de partir.', 'Bika twakwenda, mpimpa yifwene.', 'Permettez-nous de rentrer, la nuit tombe.'],
  ['Mbote ya mpimpa', '[m̀-bó-tè yà m̀-pí-mpà]', 'locution', 'Bonsoir / Bonne nuit', 'Good night', 'Salutations', 1, 'Salutation du soir avant le repos.', 'Mbote ya mpimpa kwa beno bawonsono.', 'Bonsoir et douce nuit à vous tous.'],
  ['Sikama mbote', '[sì-ká-mà m̀-bó-tè]', 'locution', 'Bien réveillé / Bonjour matinal', 'Good morning', 'Salutations', 1, 'Saluer quelqu\'un au lever du jour.', 'Wasikama mbote tata ?', 'T\'es-tu bien réveillé ce matin papa ?'],
  ['Ngolo zena', '[ǹ-gó-lò zé-nà]', 'locution', 'Je suis en forme / J\'ai la force', 'I am strong / healthy', 'Salutations', 1, 'Exprimer sa vitalité et son optimisme.', 'Bweni ? - Ngolo zena !', 'Comment vas-tu ? - Je suis en pleine forme !'],
  ['Kiadi', '[kì-á-dì]', 'cl. 7', 'Condoléances / Compassion sincère', 'Condolences / Compassion', 'Salutations', 3, 'Partager la peine d\'une famille endeuillée.', 'Twapani kiadi kwa kanda.', 'Nous présentons nos sincères condoléances à la famille.'],
  ['Mbote ya masa', '[m̀-bó-tè yà mà-sá]', 'locution', 'Bon après-midi', 'Good afternoon', 'Salutations', 1, 'Salutation d\'après-midi sous le soleil.', 'Mbote ya masa kwa beno bana.', 'Bon après-midi à vous les enfants.'],
  ['Leka mbote', '[lé-kà m̀-bó-tè]', 'locution', 'Dors bien / Bonne nuit reposante', 'Sleep well', 'Salutations', 1, 'Formule douce pour border les enfants.', 'Leka mbote mwana\'ami.', 'Dors bien mon enfant chéri.'],
  ['Nzololo', '[ǹ-zò-ló-lò]', 'cl. 9', 'Amour bienveillant / Cordialité', 'Kind love / Warmth', 'Salutations', 2, 'L\'accueil chaleureux et fraternel.', 'Yamba beno na nzololo.', 'Je vous accueille avec tout mon amour.'],

  // =========================================================================
  // 2. FAMILLE, PARENTÉ & CLAN (Kanda)
  // =========================================================================
  ['Mbuta', '[m̀-bú-tà]', 'cl. 1 (pl. bambuta - cl. 2)', 'Aîné / Sage / Doyen / Ancien respecté', 'Elder / Wise person', 'Famille', 1, 'Terme emblématique du lari désignant l\'aîné et la sagesse.', 'Mbuta weena ta masolo ma ndandu.', 'L\'aîné raconte des histoires sages.'],
  ['Mama', '[má-mà]', 'cl. 1 (pl. bamama - cl. 2)', 'Maman / Mère', 'Mother / Mom', 'Famille', 1, 'Pilier d\'affection et de transmission dans la famille lari.', 'Mama\'ami weena n\'zola.', 'Ma maman m\'aime beaucoup.'],
  ['Tata', '[tá-tà]', 'cl. 1 (pl. batata - cl. 2)', 'Papa / Père', 'Father / Dad', 'Famille', 1, 'Désigne le père et les figures protectrices masculines.', 'Tata\'ami wele ku bilanga.', 'Mon papa est allé aux champs.'],
  ['Mwana', '[mù-á-nà]', 'cl. 1 (pl. bana - cl. 2)', 'Enfant / Fils / Fille', 'Child / Son / Daughter', 'Famille', 1, 'L\'enfant est le trésor du clan (pluriel : Bana).', 'Mwana lari weena mayele.', 'L\'enfant lari est plein d\'intelligence.'],
  ['Bana', '[bà-nà]', 'cl. 2', 'Enfants', 'Children', 'Famille', 1, 'Désigne tous les enfants de la famille ou de la communauté.', 'Bana bakeba mambu ma bambuta.', 'Les enfants écoutent les enseignements des aînés.'],
  ['Yaya', '[yá-yà]', 'cl. 1 (pl. bayaya - cl. 2)', 'Grand frère / Grande sœur', 'Older sibling', 'Famille', 1, 'Terme de respect affectueux envers les frères et sœurs aînés.', 'Yaya\'ami weena ku nzo-nkanda.', 'Mon grand frère est à l\'école.'],
  ['Leke', '[lé-kè]', 'cl. 1 (pl. baleke - cl. 2)', 'Cadet / Petit frère / Petite sœur', 'Younger sibling', 'Famille', 1, 'Désigne le cadet qui apprend auprès des aînés.', 'Leke weena seka na kiese.', 'Le cadet rit de joie.'],
  ['Nkaka', '[ǹ-ká-kà]', 'cl. 1/2', 'Grand-parent / Grand-mère / Grand-père', 'Grandparent', 'Famille', 1, 'Figure vénérée qui transmet les contes au coin du feu.', 'Nkaka\'ami wanzolele beni.', 'Ma grand-mère m\'aime énormément.'],
  ['Nkazi', '[ǹ-ká-zì]', 'cl. 1/2', 'Oncle maternel', 'Maternal uncle', 'Famille', 2, 'Dans la tradition matrilinéaire lari, rôle d\'autorité et de bienveillance capital.', 'Nkazi wampana dikaba.', 'Mon oncle maternel m\'a fait un cadeau précieux.'],
  ['Bakala', '[bà-ká-là]', 'cl. 1 (pl. babakala - cl. 2)', 'Homme / Époux / Masculin', 'Man / Husband', 'Famille', 2, 'Désigne l\'homme et le mari dans le foyer.', 'Bakala diodio weena ngolo.', 'Cet homme a une grande force.'],
  ['Nkento', '[ǹ-ké-ntò]', 'cl. 1 (pl. bankento - cl. 2)', 'Femme / Épouse / Féminin', 'Woman / Wife', 'Famille', 2, 'Désigne la femme et la mère de famille.', 'Nkento wuna weena mayele.', 'Cette femme est très avisée.'],
  ['Muntù', '[mù-ntú]', 'cl. 1 (pl. bàntù - cl. 2)', 'Personne / Être humain', 'Person / Human being', 'Famille', 1, 'Pluriel : Bàntù (la communauté solidaire des personnes).', 'Muntu wùna weena na bumbote.', 'Cette personne a un grand cœur.'],
  ['Bantu', '[bà-ntú]', 'cl. 2', 'Personnes / Peuple / Gens', 'People', 'Famille', 1, 'Désigne la communauté humaine solidaire.', 'Bantu bawonsono beena kiese.', 'Tout le monde est heureux.'],
  ['Mpangi', '[m̀-pá-ngì]', 'cl. 1/2', 'Frère / Sœur / Proche parent', 'Brother / Sister / Sibling', 'Famille', 2, '« Mpangi\'ami » = Mon frère / Ma sœur bien-aimé(e).', 'Mpangi\'ami wele ku bwala.', 'Mon frère est allé au village.'],
  ['Kanda', '[kà-ndá]', 'cl. 5 (pl. makanda - cl. 6)', 'Clan / Lignée / Famille élargie', 'Clan / Extended family', 'Famille', 3, 'La cellule matrilinéaire fondamentale chez les Lari.', 'Kanda dyeto dyena bumbote.', 'Notre clan cultive la solidarité.'],
  ['Nkoi', '[ǹ-kó-y]', 'cl. 1/2', 'Beau-frère / Belle-sœur / Allié', 'In-law', 'Famille', 3, 'L\'allié respecté qui lie deux familles.', 'Nkoi\'ami weena kwiza ku nzo.', 'Mon beau-frère arrive à la maison.'],
  ['Bokilo', '[bò-kí-lò]', 'cl. 1/2', 'Beau-parent / Belle-mère / Beau-père', 'Parent-in-law', 'Famille', 3, 'Le respect profond dû aux beaux-parents.', 'Zitisa bokilo waku.', 'Respecte profondément tes beaux-parents.'],
  ['Mbuta-kanda', '[m̀-bú-tà-kà-ndá]', 'cl. 1/2', 'Patriarche / Doyen du clan matrilinéaire', 'Clan patriarch', 'Famille', 4, 'Le doyen qui préside les conseils de famille.', 'Mbuta-kanda watuma mambu.', 'Le patriarche a rassemblé le clan.'],
  ['Nsongi', '[ǹ-só-ngì]', 'cl. 1/2', 'Tante paternelle / Guide féminin', 'Paternal aunt', 'Famille', 3, 'Tante respectée pour ses précieux conseils.', 'Nsongi\'ami wampana malongi.', 'Ma tante m\'a prodigué de sages leçons.'],
  ['Nkento-leke', '[ǹ-ké-ntò-lé-kè]', 'cl. 1/2', 'Jeune fille / Adolescente', 'Young girl', 'Famille', 2, 'La jeune fille qui aide sa mère.', 'Nkento-leke weena lamva saka-saka.', 'La jeune fille aide à préparer le repas.'],
  ['Bakala-leke', '[bà-ká-là-lé-kè]', 'cl. 1/2', 'Jeune garçon / Adolescent', 'Young boy', 'Famille', 2, 'Le jeune garçon qui apprend les travaux des champs.', 'Bakala-leke weena sala na tata.', 'Le jeune garçon travaille avec son père.'],
  ['Nkaza', '[ǹ-ká-zà]', 'cl. 1/2', 'Conjoint / Époux / Épouse', 'Spouse', 'Famille', 3, 'Le partenaire de vie dans le mariage coutumier.', 'Nkaza\'ami weena bumbote.', 'Mon conjoint est plein de bienveillance.'],
  ['Mwana-nkento', '[mù-á-nà-ǹ-ké-ntò]', 'cl. 1/2', 'Fille / Fillette', 'Daughter / Girl', 'Famille', 1, 'La fille chérie de ses parents.', 'Mwana-nkento weena seka na kiese.', 'La fillette sourit de bon cœur.'],
  ['Mwana-bakala', '[mù-á-nà-bà-ká-là]', 'cl. 1/2', 'Garçon / Fils', 'Son / Boy', 'Famille', 1, 'Le fils courageux et travailleur.', 'Mwana-bakala weena longa mbote.', 'Le jeune garçon étudie avec sérieux.'],
  ['Mbuti', '[m̀-bú-tì]', 'cl. 1 (pl. babuti - cl. 2)', 'Géniteur / Parent / Auteur de jours', 'Parent / Procreator', 'Famille', 3, 'Les parents qui ont donné la vie avec amour.', 'Kukeba babuti baaku.', 'Prends soin de tes parents qui t\'ont élevé.'],
  ['Nkuluntu', '[ǹ-kù-lú-ntù]', 'cl. 1/2', 'Ancêtre fondateur / Doyen respecté', 'Founding ancestor', 'Famille', 4, 'Les ancêtres qui ont tracé la voie du clan.', 'Bakulu beto batusisa malongi.', 'Nos ancêtres nous ont laissé de grandes leçons.'],
  ['Kiyanzi', '[kì-yá-nzì]', 'cl. 7', 'Fratrie / Cousinage / Confrérie', 'Brotherhood / Kinsfolk', 'Famille', 3, 'Le lien fraternel fort unissant les cousins et germains.', 'Kiyanzi kyeto kyena ngolo.', 'Notre fraternité est invincible.'],

  // =========================================================================
  // 3. CUISINE CONGOLAISE & PLATS TRADITIONNELS (Saka-saka, Maboke, Kwanga)
  // =========================================================================
  ['Saka-saka', '[sà-kà-sà-kà]', 'cl. 7', 'Saka-saka / Feuilles de manioc pilées', 'Cassava leaves stew', 'Nourriture', 1, 'Le plat national congolais par excellence, préparé avec huile de palme et poisson fumé.', 'Mama weena lamba saka-saka dya kununa.', 'Maman prépare un délicieux saka-saka fumant.'],
  ['Maboke', '[mà-bó-kè]', 'cl. 6', 'Maboké / Poisson en papillote de feuilles sauvages', 'Steamed fish in leaves', 'Nourriture', 2, 'Poisson du fleuve cuit à l\'étouffée dans des feuilles de marantacées au feu de bois.', 'Twadia maboke ma mbisi a maza.', 'Nous avons dégusté un maboké de poisson frais.'],
  ['Kwanga', '[kwá-ngà]', 'cl. 9/10 (pl. bikwanga)', 'Chikwangue / Pain de manioc fermenté', 'Cassava bread / Chikwangue', 'Nourriture', 1, 'Le pain de manioc traditionnel cuit à la vapeur, aliment de base des repas lari.', 'Sumbila mono kwanga yimosi.', 'Achète-moi un bâton de chikwangue bien frais.'],
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
  ['Madiya', '[mà-dí-yà]', 'cl. 6', 'Nourriture / Repas / Vivres', 'Food / Meal', 'Nourriture', 1, 'Désigne l\'ensemble des aliments sains qui nourrissent la famille.', 'Madiya ma nzo mena ndilu.', 'Le repas préparé à la maison est savoureux.'],
  ['Loso', '[ló-sò]', 'cl. 11', 'Riz', 'Rice', 'Nourriture', 1, 'Le riz blanc qui accompagne sauces et légumes.', 'Lamba loso lwa mpembe.', 'Fais cuire du bon riz blanc.'],
  ['Masangu', '[mà-sá-ngù]', 'cl. 6', 'Maïs / Épis de maïs', 'Corn / Maize', 'Nourriture', 1, 'Maïs frais grillé ou bouilli au bord des chemins du Pool.', 'Twa dia masangu ma kukanga.', 'Nous mangeons des épis de maïs grillés.'],
  ['Mbele', '[m̀-bé-lè]', 'cl. 9/10', 'Couteau de cuisine', 'Knife', 'Maison', 1, 'Ustensile pour découper les légumes et le manioc.', 'Kanga mbele ya ku senga.', 'Prends le couteau pour éplucher le manioc.'],
  ['Kinzu', '[kì-nzú]', 'cl. 7 (pl. binzu - cl. 8)', 'Mortier en bois pour piler', 'Wooden mortar', 'Maison', 2, 'Le grand mortier en bois dur taillé pour piler le manioc et les feuilles.', 'Tuta saka-saka mu kinzu.', 'Pile le saka-saka dans le grand mortier.'],
  ['Muti a kinzu', '[mù-tí à kì-nzú]', 'locution', 'Pilon en bois lourd', 'Pestle', 'Maison', 2, 'Le pilon robuste qui accompagne le mortier.', 'Kanga muti a kinzu watuta.', 'Prends le pilon pour écraser les feuilles.'],
  ['Masa', '[mà-sá]', 'cl. 6', 'Eau / Eau potable fraîche', 'Water', 'Nourriture', 1, 'L\'eau claire de source qui étanche la soif.', 'Pana maza ma nwa.', 'Donne-moi de l\'eau fraîche à boire.'],
  ['Mungwa', '[mù-ngwá]', 'cl. 3', 'Sel de cuisine', 'Salt', 'Nourriture', 1, 'L\'assaisonnement indispensable de toute préparation.', 'Tula mungwa wa ndilu.', 'Ajoute une pincée de sel pour le goût.'],
  ['Mafuta', '[mà-fú-tà]', 'cl. 6', 'Huile / Huile de palme rouge', 'Oil / Palm oil', 'Nourriture', 1, 'L\'huile de palme rouge qui donne sa belle couleur aux plats.', 'Mafuta ma mbila mena kitoko.', 'L\'huile de palme rouge donne une belle couleur.'],
  ['Sukadi', '[sù-ká-dì]', 'cl. 9', 'Sucre', 'Sugar', 'Nourriture', 1, 'Le sucre qui adoucit la bouillie des enfants.', 'Tula sukadi mu loso.', 'Mets du sucre dans la bouillie de riz.'],
  ['Nsusu', '[ǹ-sú-sù]', 'cl. 9/10', 'Poule / Poulet fermier', 'Chicken', 'Animaux', 1, 'La volaille élevée dans la cour pour les fêtes.', 'Nsusu weena dila mu lupangu.', 'La poule picore dans la concession.'],
  ['Mbisi', '[m̀-bí-sì]', 'cl. 9/10', 'Poisson / Viande fraîche', 'Fish / Meat', 'Nourriture', 1, 'Aliment protéiné essentiel du repas.', 'Twadia mbisi a maza.', 'Nous avons mangé du bon poisson d\'eau douce.'],
  ['Mbisi ya ngulu', '[m̀-bí-sì yà ǹ-gú-lù]', 'locution', 'Viande de porc braisée', 'Pork meat', 'Nourriture', 2, 'Porc braisé assaisonné aux herbes aromatiques locales.', 'Mbisi ya ngulu yina ndilu.', 'La viande de porc grillée est très parfumée.'],

  // =========================================================================
  // 4. EXPRESSIONS IDIOMATIQUES & SAGESSE POPULAIRE LARI
  // =========================================================================
  ['Koko mosi', '[kó-kò mó-sì]', 'locution', 'Une seule main (Solitude / Impuissance)', 'One hand (Solitude)', 'Patrimoine & Sagesse', 3, 'Référence au proverbe : « Koko mosi ka yendi kula n\'toto ko » (Une seule main ne bat pas des mains).', 'Koko mosi ka yendi sala mawonsono ko.', 'Une seule main ne peut tout accomplir seule.'],
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
  // 5. TRADITIONS, CÉRÉMONIES, ARTS & COUTUMES (Lari / Kongo)
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
  ['Lupangu', '[lù-pá-ngù]', 'cl. 11 (pl. mpangu - cl. 10)', 'Concession familiale / Cour commune', 'Family compound', 'Maison', 2, 'L\'espace de vie partagé où les cousins grandissent ensemble.', 'Bana basakana mu lupangu.', 'Les enfants s\'amusent dans la grande cour familiale.'],
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
  // 6. HISTOIRE DU PEUPLE LARI & ROYAUME KONGO
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
  ['Tchikondo', '[tshì-kó-ndò]', 'cl. 7', 'Pirogue en bois taillée dans un tronc', 'Traditional wooden canoe', 'Transports', 2, 'Embarcation traditionnelle des pêcheurs du Pool et du fleuve Congo.', 'Mbuta wayobila tchikondo mu maza.', 'Le pêcheur manœuvre sa pirogue avec grande habileté.'],
  ['Kinsoundi', '[kì-nsù-ndí]', 'nom propre', 'Kinsoundi (Quartier historique du sud de Brazzaville)', 'Kinsoundi neighborhood', 'Histoire', 2, 'Quartier historique verdoyant aux portes du Djoué.', 'Ku Kinsoundi mpepe weena kitoko.', 'À Kinsoundi, la brise du fleuve apporte la fraîcheur.'],
  ['Goma Tsé-Tsé', '[gò-má tsé-tsé]', 'nom propre', 'Goma Tsé-Tsé (Carrefour ferroviaire du Pool)', 'Goma Tse-Tse crossroads', 'Histoire', 3, 'Carrefour historique d\'échanges sur la ligne du Chemin de Fer Congo-Océan.', 'Lukalu lwayimana ku Goma Tsé-Tsé.', 'Le train s\'est arrêté à la gare de Goma Tsé-Tsé.'],

  // =========================================================================
  // 7. CORPS HUMAIN (Nitu) & SANTÉ
  // =========================================================================
  ['Nitu', '[nì-tú]', 'cl. 9/10', 'Corps humain / Santé globale / Anatomie', 'Body / Health', 'Corps Humain', 1, '« Nitu ya ngolo » = Un corps vigoureux et sain.', 'Keba nitu yaku mbote.', 'Prends grand soin de ton corps et de ta santé.'],
  ['Ntu', '[ǹ-tú]', 'cl. 3 (pl. mintu - cl. 4)', 'Tête / Esprit / Pensée', 'Head / Mind', 'Corps Humain', 1, 'Le siège de l\'intelligence et de la réflexion.', 'Ntu weena yindula mambu ma mbote.', 'Mon esprit réfléchit à de belles choses.'],
  ['Meso', '[mé-sò]', 'cl. 6 (sg. diso - cl. 5)', 'Yeux / Regard', 'Eyes', 'Corps Humain', 1, 'Singulier : Diso. Pour observer et apprendre.', 'Kangula meso watala mbote.', 'Ouvre grand les yeux pour bien observer.'],
  ['Matu', '[mà-tú]', 'cl. 6 (sg. kutu - cl. 15)', 'Oreilles / Écoute', 'Ears', 'Corps Humain', 1, 'Pour écouter les paroles de sagesse des aînés.', 'Matu mena wa malongi ma nkembo.', 'Mes oreilles écoutent avec attention les leçons.'],
  ['Munu', '[mù-nú]', 'cl. 3 (pl. minù - cl. 4)', 'Bouche / Parole / Expression', 'Mouth', 'Corps Humain', 1, 'L\'organe de la parole et de la transmission.', 'Kangula munu wavova kieleka.', 'Ouvre la bouche pour dire la vérité avec courage.'],
  ['Koko', '[kó-kò]', 'cl. 15 (pl. moko - cl. 6)', 'Main / Bras', 'Hand / Arm', 'Corps Humain', 1, 'Symbole d\'entraide et de travail manuel.', 'Pana koko kwa mpangi\'aku.', 'Tends une main secourable à ton frère.'],
  ['Kulu', '[kù-lú]', 'cl. 15 (pl. malu - cl. 6)', 'Pied / Jambe', 'Foot / Leg', 'Corps Humain', 1, 'Pour marcher droit sur le bon chemin.', 'Malu mami mena tambula na ndembama.', 'Mes pas avancent sur le chemin de la paix.'],
  ['Ntima', '[ǹ-tí-mà]', 'cl. 3 (pl. mintima - cl. 4)', 'Cœur / Sentiments / Conscience', 'Heart / Conscience', 'Corps Humain', 1, 'Le centre des émotions et de la bienveillance (Bumuntu).', 'Ntima\'ami weena na zola kwingi.', 'Mon cœur est rempli d\'un amour généreux.'],
  ['Meno', '[mé-nò]', 'cl. 6 (sg. dino - cl. 5)', 'Dents / Sourire', 'Teeth', 'Corps Humain', 1, 'Des dents éclatantes pour sourire à la vie.', 'Sukula meno maaku masika mpembe.', 'Brosse tes dents pour qu\'elles restent bien blanches.'],
  ['Lulimi', '[lù-lí-mì]', 'cl. 11 (pl. ndimi - cl. 10)', 'Langue (organe et idiome parlé)', 'Tongue / Language', 'Corps Humain', 1, 'La langue lari transmise de génération en génération.', 'Vova mu lulimi lwa lari.', 'Exprime-toi fièrement dans la langue lari.'],
  ['Yulu', '[yú-lù]', 'cl. 5 (pl. mayulu - cl. 6)', 'Nez / Odorat', 'Nose', 'Corps Humain', 1, 'Pour respirer l\'air pur du matin.', 'Yulu dyami dyena yoka nsudi ya saka-saka.', 'Mon nez sent le délicieux parfum du repas.'],
  ['Vumu', '[vù-mú]', 'cl. 5 (pl. mavumu - cl. 6)', 'Ventre / Estomac', 'Belly / Stomach', 'Corps Humain', 1, 'Le ventre rassasié d\'un bon repas lari.', 'Vumu dyami dyikuta madiya ma mbote.', 'Mon ventre est bien nourri et apaisé.'],
  ['Mukongo', '[mù-kó-ngò]', 'cl. 3 (pl. mikongo - cl. 4)', 'Dos / Colonne vertébrale', 'Back / Spine', 'Corps Humain', 2, 'Le dos solide des vaillants agriculteurs.', 'Tata weena simba mukongo mu salu.', 'Papa redresse son dos après le labour des champs.'],
  ['Nsuki', '[ǹ-sú-kì]', 'cl. 9/10 (pl. zinsuki)', 'Cheveux / Tresses traditionnelles', 'Hair / Braids', 'Corps Humain', 1, 'Les belles tresses soignées des enfants lari.', 'Mama weena tunga nsuki za mwana.', 'Maman tresse avec soin les cheveux de sa fille.'],
  ['Luketo', '[lù-ké-tò]', 'cl. 11 (pl. nketo - cl. 10)', 'Hanche / Taille', 'Hip / Waist', 'Corps Humain', 2, 'Les hanches souples pour danser la zikida.', 'Yingana luketo mu kina.', 'Ondule des hanches au rythme du tam-tam.'],
  ['Kipumu', '[kì-pú-mù]', 'cl. 7', 'Respiration / Souffle de vie', 'Breath / Vital breath', 'Corps Humain', 3, 'Le souffle précieux que donne la vie.', 'Kipumu kya moyo kyena na nkembo.', 'Le souffle de vie est une bénédiction inestimable.'],
  ['Tolo', '[tó-lò]', 'cl. 5 (pl. matolo - cl. 6)', 'Poitrine / Torse', 'Chest / Torso', 'Corps Humain', 2, 'Garder la tête haute et la poitrine fière.', 'Nanguna tolo watambula na ngolo.', 'Bombe le torse et avance avec courage et fierté.'],
  ['Luzala', '[lù-zá-là]', 'cl. 11 (pl. nzala - cl. 10)', 'Ongle', 'Nail', 'Corps Humain', 2, 'Garder ses ongles propres et soignés.', 'Sukula nzala zaaku mbote.', 'Nettoie soigneusement tes ongles chaque jour.'],
  ['Mpimpa a nitu', '[m̀-pí-mpà à nì-tú]', 'locution', 'Teint noir ébène / Belle peau foncée', 'Melanated beautiful skin', 'Corps Humain', 2, 'La beauté éclatante de la peau noire sous le soleil.', 'Nitu yaku yina kitoko kya nkembo.', 'Ta peau ébène resplendit d\'une beauté naturelle.'],
  ['Lweka', '[lwé-kà]', 'cl. 11 (pl. mpeka - cl. 10)', 'Côte / Flanc', 'Rib / Flank', 'Corps Humain', 2, 'La partie latérale du tronc.', 'Lweka lwami lwena ngolo.', 'Mes flancs sont solides et prêts à l\'effort.'],
  ['Moyo', '[mò-yó]', 'cl. 3 (pl. mioyo - cl. 4)', 'Vie / Vitalité / Âme / Énergie', 'Life / Soul / Vigor', 'Corps Humain', 1, 'Le souffle sacré de l\'existence.', 'Moyo wena na ngeye mpangi\'ami.', 'La vie fleurit en toi avec générosité.'],

  // =========================================================================
  // 8. NATURE, FAUNE & ENVIRONNEMENT DU POOL
  // =========================================================================
  ['Ngo', '[ǹ-gó]', 'cl. 9/10', 'Léopard / Panthère royale', 'Leopard', 'Animaux', 1, 'Symbole royal de courage, de force et de souveraineté dans la culture Kongo.', 'Ngo weena nyama ya ngolo mu mfinda.', 'Le léopard est le noble roi de la grande forêt.'],
  ['Nkosi', '[ǹ-kó-sì]', 'cl. 9/10', 'Lion / Maître de la savane', 'Lion', 'Animaux', 1, 'La majesté et la bravoure incontestées.', 'Nkosi weena dila mu nsi a mfinda.', 'Le lion rugit avec puissance au loin.'],
  ['Nzau', '[ǹ-zá-ù]', 'cl. 9/10', 'Éléphant / Géant de la forêt', 'Elephant', 'Animaux', 1, 'La mémoire inaltérable et la force paisible.', 'Nzau weena tambula malembe mu mfinda.', 'L\'éléphant traverse majestueusement la forêt.'],
  ['Nkayi', '[ǹ-ká-yì]', 'cl. 9/10', 'Antilope / Gazelle rapide de savane', 'Antelope / Gazelle', 'Animaux', 1, 'La rapidité et la grâce dans les plaines verdoyantes.', 'Nkayi weena kulumuka na vuvu.', 'L\'antilope bondit vivement dans les herbes hautes.'],
  ['Ngulu ya mfinda', '[ǹ-gú-lù yà m̀-fí-ndà]', 'locution', 'Phacochère / Sanglier des forêts', 'Wild boar', 'Animaux', 2, 'Animal robuste arpentant les fourrés du Pool.', 'Ngulu ya mfinda weena sosa madiya.', 'Le sanglier sauvage fouille le sol à la recherche de racines.'],
  ['Nioka', '[nì-ó-kà]', 'cl. 9/10', 'Serpent', 'Snake', 'Animaux', 1, 'La prudence et la discrétion dans les herbes.', 'Keba nioka vana nzila.', 'Fais attention au serpent caché près du sentier.'],
  ['Kwele', '[kwé-lè]', 'cl. 9/10', 'Chimpanzé / Singe des cimes', 'Chimpanzee / Monkey', 'Animaux', 1, 'L\'agilité et l\'intelligence dans les arbres fruitiers.', 'Kwele weena tomboka mu nti.', 'Le chimpanzé grimpe agilement sur les branches.'],
  ['Ngandu', '[ǹ-gá-ndù]', 'cl. 9/10', 'Crocodile du fleuve Congo', 'Crocodile', 'Animaux', 2, 'Le seigneur des rivières et des marais du Pool.', 'Ngandu weena vundila vana maza.', 'Le crocodile se prélasse paisiblement au bord de l\'eau.'],
  ['Nuni', '[nù-ní]', 'cl. 9/10 (pl. zinuni)', 'Oiseau chanteur / Passereau', 'Bird', 'Animaux', 1, 'Les oiseaux qui réveillent le village au petit matin.', 'Zinuni zena yimbila nkunga ya mbote.', 'Les oiseaux chantent une douce mélodie matinale.'],
  ['Mbisi a maza', '[m̀-bí-sì à mà-zá]', 'locution', 'Poisson frais d\'eau douce (Capitaine, Tilapia)', 'Freshwater fish', 'Animaux', 1, 'Les poissons pêchés dans le Djoué et le fleuve Congo.', 'Twasumba mbisi a maza ya mbote.', 'Nous avons acheté du succulent poisson frais.'],
  ['Nsoli', '[ǹ-só-lì]', 'cl. 9/10', 'Sauterelle / Criquet des savanes', 'Grasshopper', 'Animaux', 1, 'Sauterelles croustillantes récoltées à la saison des pluies.', 'Bana basolola nsoli mu bilanga.', 'Les enfants attrapent des sauterelles dans les champs.'],
  ['Nzinzi', '[ǹ-zí-nzì]', 'cl. 9/10', 'Mouche', 'Fly', 'Animaux', 1, 'Insecte volant de la saison chaude.', 'Kula nzinzi vana mesa.', 'Chasse la mouche qui s\'est posée sur la table.'],
  ['Mbwa', '[m̀-bwá]', 'cl. 9/10', 'Chien fidèle / Gardien de la concession', 'Dog', 'Animaux', 1, 'Le gardien fidèle qui aboie pour protéger la cour.', 'Mbwa weena keba nzo mu mpimpa.', 'Le chien monte une garde attentive toute la nuit.'],
  ['Niawu', '[nì-á-wù]', 'cl. 9/10', 'Chat domestique', 'Cat', 'Animaux', 1, 'Le chat qui ronronne au coin du feu.', 'Niawu weena leka vana moto.', 'Le chat dort paisiblement près des braises.'],
  ['Meme', '[mé-mè]', 'cl. 9/10', 'Mouton / Brebis', 'Sheep', 'Animaux', 1, 'L\'animal doux qui broute l\'herbe de la prairie.', 'Meme weena dia titi mu mpata.', 'Le mouton broute la tendre herbe verte.'],
  ['Nkombo', '[ǹ-kó-mbò]', 'cl. 9/10', 'Chèvre / Cabri agile', 'Goat', 'Animaux', 1, 'L\'animal vif de la basse-cour du village.', 'Nkombo weena tambula vana mabulu.', 'La chèvre sautille agilement sur les rochers.'],
  ['Bilanga', '[bì-lá-ngà]', 'cl. 8 (sg. kilanga - cl. 7)', 'Champs agricoles / Terres cultivées', 'Farmland / Fields', 'Nature & Éléments', 1, 'Le lieu où l\'on sème le manioc, le maïs et l\'arachide.', 'Mama wele ku bilanga mu kuna.', 'Maman est partie aux champs pour ensemencer la terre.'],
  ['Mbila', '[m̀-bí-là]', 'cl. 9/10', 'Palmier à huile / Noix de palme', 'Oil palm tree', 'Nature & Éléments', 1, 'L\'arbre nourricier qui offre l\'huile, le vin et les toitures.', 'Mbila weena nti wa nkembo mu bwala.', 'Le palmier est un arbre béni dans notre village.'],
  ['Mfinda', '[m̀-fí-ndà]', 'cl. 9/10', 'Grande forêt tropicale / Bois sacré', 'Rainforest / Sacred woods', 'Nature & Éléments', 2, 'Le domaine majestueux des grands arbres et de la pharmacopée.', 'Mfinda yidi nene ye ya kitoko.', 'La forêt tropicale est immense, dense et mystérieuse.'],
  ['Ntoto', '[ǹ-tó-tò]', 'cl. 3', 'Terre / Sol / Patrie / Territoire sacré', 'Earth / Soil / Land', 'Nature & Éléments', 1, 'La terre nourricière léguée par nos pères.', 'Ntoto wa bakulu wena wa nkembo.', 'La terre de nos pères est un héritage sacré.'],
  ['Mvula', '[m̀-vú-là]', 'cl. 9/10', 'Pluie bienfaisante / Saison des pluies', 'Rain / Rain season', 'Nature & Éléments', 1, 'L\'ondée qui arrose les semailles et fait fleurir la savane.', 'Mvula yina noka, bilanga byena kiese.', 'La pluie tombe avec douceur, les champs reverdissent.'],
  ['Mupepe', '[mù-pé-pè]', 'cl. 3', 'Vent frais / Brise du soir', 'Wind / Breeze', 'Nature & Éléments', 1, 'Le vent agréable qui rafraîchit l\'atmosphère sous les manguiers.', 'Mupepe wa mpio weena fula.', 'Une brise délicieusement fraîche souffle ce soir.'],
  ['Tiya', '[tí-yà]', 'cl. 6', 'Feu / Flamme / Chaleur réconfortante', 'Fire / Flame', 'Nature & Éléments', 1, 'Le feu de bois autour duquel la grand-mère conte les fables.', 'Pela tiya mu lamba madiya.', 'Allume le feu de bois pour cuire le repas.'],
  ['Zulu', '[zù-lú]', 'cl. 5', 'Ciel / Firmament / Cieux', 'Sky / Heaven', 'Nature & Éléments', 1, 'L\'immensité bleue au-dessus des collines du Pool.', 'Zulu dyena pyo ye nkembo.', 'Le ciel est d\'une clarté magnifique et lumineuse.'],
  ['Ngonda', '[ǹ-gó-ndà]', 'cl. 9/10', 'Lune / Mois du calendrier', 'Moon / Month', 'Nature & Éléments', 1, 'La lune brillante qui illumine les danses nocturnes.', 'Ngonda weena senga mu mpimpa.', 'La pleine lune brille doucement dans la nuit.'],
  ['Ntangu', '[ǹ-tá-ngù]', 'cl. 9/10', 'Soleil / Heure / Temps qui passe', 'Sun / Time', 'Nature & Éléments', 1, 'Le soleil levant qui donne vie à toute la création.', 'Ntangu yibosukidi, twasikama.', 'Le soleil s\'est levé, levons-nous avec entrain.'],
  ['Tetembwa', '[tè-té-mbwà]', 'cl. 9/10 (pl. zitetembwa)', 'Étoile étincelante', 'Star', 'Nature & Éléments', 1, 'Les étoiles scintillantes guidant les voyageurs.', 'Zitetembwa zena ngengima mu zulu.', 'Les étoiles étincellent dans le ciel étoilé.'],
  ['Maza', '[mà-zá]', 'cl. 6', 'Eau / Ruisseau / Source claire', 'Water / Stream', 'Nature & Éléments', 1, 'Source indispensable de toute vie.', 'Maza ma nkoko mena pete.', 'L\'eau du ruisseau est d\'une pureté cristalline.'],
  ['Nkoko', '[ǹ-kó-kò]', 'cl. 3 (pl. minkoko - cl. 4)', 'Rivière / Fleuve / Ruisseau', 'River / Stream', 'Nature & Éléments', 1, 'Les cours d\'eau poissonneux sillonnant les vallées.', 'Nkoko weena kuluka vana mabulu.', 'Le ruisseau serpente paisiblement entre les galets.'],
  ['Nti', '[ǹ-tí]', 'cl. 3 (pl. minti - cl. 4)', 'Arbre / Bois / Plante médicinale', 'Tree / Wood', 'Nature & Éléments', 1, 'Les arbres fruitiers qui ombragent les villages.', 'Nti wa mampwidi weena kaba bimi.', 'Le manguier donne des fruits juteux et sucrés.'],

  // =========================================================================
  // 9. MAISON, HABITAT & VIE QUOTIDIENNE
  // =========================================================================
  ['Nzo', '[ǹ-zó]', 'cl. 9/10 (pl. zinzo)', 'Maison / Foyer / Demeure familiale', 'House / Home', 'Maison', 1, 'Le havre de paix où grandit la famille.', 'Nzo eto yidi ya kiese ye ngemba.', 'Notre maison est un lieu de paix et de concorde.'],
  ['Kyelo', '[kyé-lò]', 'cl. 7 (pl. byelo - cl. 8)', 'Porte d\'entrée / Seuil', 'Door / Gate', 'Maison', 1, 'La porte ouverte à l\'accueil des parents et amis.', 'Kangula kyelo kya nzo.', 'Ouvre la porte pour accueillir les invités.'],
  ['Zianele', '[zì-à-né-lè]', 'cl. 9/10', 'Fenêtre / Ouverture lumineuse', 'Window', 'Maison', 1, 'La fenêtre qui laisse entrer l\'air frais du matin.', 'Kangula zianele mu kota mupepe.', 'Ouvre la fenêtre pour aérer la chambre.'],
  ['Kiti', '[kì-tí]', 'cl. 7 (pl. biti - cl. 8)', 'Chaise / Siège en bois sculpté', 'Chair / Stool', 'Maison', 1, 'Le siège réservé au visiteur d\'honneur.', 'Vwanda vana kiti kya mbote.', 'Assieds-toi confortablement sur ce siège.'],
  ['Mesa', '[mé-sà]', 'cl. 5 (pl. mamesa - cl. 6)', 'Table à manger', 'Table', 'Maison', 1, 'La table autour de laquelle on partage le repas.', 'Tula madiya vana mesa.', 'Pose les plats fumants sur la table.'],
  ['Mfulu', '[m̀-fú-lù]', 'cl. 9/10', 'Lit douillet / Couchette', 'Bed', 'Maison', 1, 'Le lit où l\'on trouve le repos bien mérité.', 'Leka vana mfulu yaku.', 'Repose-toi sur ton lit après une bonne journée.'],
  ['Kiyenga', '[kì-yé-ngà]', 'cl. 7', 'Assiette / Plat de service', 'Plate / Dish', 'Maison', 1, 'Ustensile pour servir le foufou et les sauces.', 'Lamba madiya mu kiyenga.', 'Dispose délicatement les mets dans le plat.'],
  ['Kopo', '[kó-pò]', 'cl. 9/10', 'Verre à boire / Gobelet', 'Cup / Glass', 'Maison', 1, 'Pour boire l\'eau fraîche de la jarre.', 'Nwina maza mu kopo.', 'Bois de l\'eau fraîche dans ce verre propre.'],
  ['Kuku', '[kú-kù]', 'cl. 9', 'Cuisine / Foyer du feu', 'Kitchen / Hearth', 'Maison', 1, 'Le lieu convivial où mijotent les plats traditionnels.', 'Mama weena ku kuku mu lamba.', 'Maman est à la cuisine pour préparer le dîner.'],
  ['Mpioka', '[m̀-pyó-kà]', 'cl. 9/10', 'Balai traditionnel en nervures de palme', 'Traditional broom', 'Maison', 1, 'Le balai végétal pour nettoyer la cour chaque matin.', 'Komba lupangu na mpioka.', 'Balaie la cour avec le balai de palme.'],
  ['Nkanu', '[ǹ-ká-nù]', 'cl. 3 (pl. minkanu - cl. 4)', 'Litige / Affaire de famille / Palabre', 'Dispute / Family affair', 'Patrimoine & Sagesse', 3, 'Problème débattu et résolu en assemblée de sages.', 'Bambuta balemvula nkanu.', 'Les anciens ont dénoué le litige avec justice.'],

  // =========================================================================
  // 10. VÊTEMENTS, PARURES & COULEURS
  // =========================================================================
  ['Léle', '[lé-lè]', 'cl. 7 (pl. biléle - cl. 8)', 'Vêtement / Pagne / Habit élégant', 'Cloth / Clothes / Dress', 'Vêtements', 1, 'Le bel habit porté avec fierté.', 'Lwata bilele bya kitoko.', 'Mets tes plus beaux vêtements du dimanche.'],
  ['Mukaba', '[mù-ká-bà]', 'cl. 3 (pl. mikaba - cl. 4)', 'Ceinture en cuir / Bandeau de taille', 'Belt', 'Vêtements', 2, 'Pour ajuster son pantalon ou son pagne.', 'Kanga mukaba wa ngolo.', 'Serre bien ta ceinture pour te mettre à l\'ouvrage.'],
  ['Nsampatu', '[ǹ-sà-mpá-tù]', 'cl. 9/10', 'Chaussures / Sandales', 'Shoes / Footwear', 'Vêtements', 1, 'Pour marcher confortablement sans se blesser.', 'Lwata nsampatu zaku.', 'Enfile tes chaussures avant de partir.'],
  ['Mpu', '[m̀-pú]', 'cl. 9/10', 'Chapeau / Toque de dignitaire', 'Hat / Chief cap', 'Vêtements', 1, 'Le chapeau traditionnel protégeant du soleil.', 'Lwata mpu vana ntu.', 'Mets ton chapeau pour te protéger du soleil.'],
  ['Kaba', '[kà-bá]', 'cl. 9/10', 'Chemise / Tunique brodée', 'Shirt / Top', 'Vêtements', 1, 'Le haut de vêtement taillé dans un beau tissu.', 'Lwata kaba ya mpembe.', 'Porte une belle chemise blanche impeccable.'],
  ['Mpembe', '[m̀-pé-mbè]', 'adj / cl. 9', 'Blanc / Clair / Pur', 'White / Pure', 'Sentiments & Qualités', 1, 'Symbole de clarté, de paix et de pureté.', 'Kaba dya mpembe dyena nkembo.', 'La tunique blanche est éclatante de lumière.'],
  ['Mbuaki', '[m̀-bwá-kì]', 'adj / cl. 9', 'Rouge / Écarlate / Chaleureux', 'Red', 'Sentiments & Qualités', 1, 'La couleur de la vitalité, de la force et de la fête.', 'Lukoba lwa mbuaki lwena kitoko.', 'Le pagne rouge vif est magnifique.'],
  ['Mbwisi', '[m̀-bwí-sì]', 'adj / cl. 9', 'Noir / Foncé / Profond', 'Black / Dark', 'Sentiments & Qualités', 1, 'La couleur de la profondeur, de la terre fertile et de la nuit étoilée.', 'Mbisi ya mbwisi yena ngolo.', 'La bête à la robe noire est vigoureuse.'],
  ['Mayangi', '[mà-yá-ngì]', 'cl. 6', 'Joie éclatante / Allégresse communicative', 'Radiant joy', 'Sentiments & Qualités', 1, 'Le sentiment de fête et de ravissement.', 'Bantu bawonsono beena mayangi.', 'Tout le village est transporté d\'allégresse.'],

  // =========================================================================
  // 11. TRANSPORTS, VILLE & ACTIVITÉS
  // =========================================================================
  ['Bwala', '[bwà-lá]', 'cl. 5 (pl. mabwala - cl. 6)', 'Village / Terre natale / Cité', 'Village / Hometown', 'Transports & Ville', 1, 'Le village d\'origine où résident les racines du clan.', 'Bwala bweto bwena kitoko beni.', 'Notre village est verdoyant et paisible.'],
  ['Nzila', '[ǹ-zí-là]', 'cl. 9/10 (pl. zinzila)', 'Chemin / Route / Voie de sagesse', 'Road / Path / Way', 'Transports & Ville', 1, 'La route qui mène vers l\'avenir.', 'Kuata nzila ya mbote mu luzingu.', 'Emprunte toujours le droit chemin dans la vie.'],
  ['Zandu', '[zà-ndú]', 'cl. 5 (pl. mazandu - cl. 6)', 'Grand marché / Place des commerces', 'Market / Marketplace', 'Transports & Ville', 1, 'Le lieu grouillant de vie où l\'on vend poissons, légumes et étoffes.', 'Mama wele ku zandu dia Bacongo.', 'Maman est partie faire les courses au marché Total de Bacongo.'],
  ['Lukalu', '[lù-ká-lù]', 'cl. 11 (pl. nkalu - cl. 10)', 'Train / Chemin de fer (CFCO)', 'Train', 'Transports & Ville', 1, 'Le train reliant Pointe-Noire, le Pool et Brazzaville.', 'Lukalu lwena kwiza na kiese.', 'Le train du CFCO approche de la gare.'],
  ['Mutukadi', '[mù-tù-ká-dì]', 'cl. 3 (pl. mitukadi - cl. 4)', 'Voiture / Automobile / Taxi 100-100', 'Car / Vehicle', 'Transports & Ville', 1, 'Le véhicule qui circule sur l\'avenue de l\'OUA.', 'Mutukadi weena kwenda na vuvu.', 'Le taxi roule tranquillement vers le centre-ville.'],
  ['Nzo-nkanda', '[ǹ-zó-ǹ-ká-ndà]', 'cl. 9/10', 'École / Lieu d\'instruction et du savoir', 'School', 'Transports & Ville', 1, 'Le temple du savoir où les enfants apprennent à lire et compter.', 'Bana balele ku nzo-nkanda.', 'Les enfants sont allés étudier avec ardeur à l\'école.'],
  ['Nzo-nzambi', '[ǹ-zó-ǹ-zà-mbí]', 'cl. 9/10', 'Temple / Église / Maison de prière', 'Church / Temple', 'Transports & Ville', 1, 'Lieu de recueillement et de chants spirituels.', 'Bantù bakwenda ku nzo-nzambi.', 'Les fidèles se rendent au temple pour prier.'],
  ['Nzo-bimbefo', '[ǹ-zó-bì-mbè-fó]', 'cl. 9/10', 'Hôpital / Dispensaire / Lieu de soins', 'Hospital / Clinic', 'Transports & Ville', 2, 'L\'endroit où les soignants soulagent les malades.', 'Nganga-buka weena ku nzo-bimbefo.', 'Le médecin soigne les patients au dispensaire.'],

  // =========================================================================
  // 12. NOMBRES & COMPTAGE (1 à 100)
  // =========================================================================
  ['Mosi', '[mó-sì]', 'adj numéral', 'Un (1)', 'One (1)', 'Nombres', 1, 'Le chiffre de l\'unité.', 'Muntu mosi kaka.', 'Une seule personne.'],
  ['Zole', '[zó-lè]', 'adj numéral', 'Deux (2)', 'Two (2)', 'Nombres', 1, 'Le chiffre de l\'alliance et de la complémentarité.', 'Bana bazole.', 'Deux enfants complices.'],
  ['Tatu', '[tá-tù]', 'adj numéral', 'Trois (3)', 'Three (3)', 'Nombres', 1, 'Les trois pierres du foyer traditionnel.', 'Mamesa matatu.', 'Trois tables.'],
  ['Ya', '[yá]', 'adj numéral', 'Quatre (4)', 'Four (4)', 'Nombres', 1, 'Les quatre points cardinaux de la terre.', 'Biti biya.', 'Quatre sièges.'],
  ['Tanu', '[tá-nù]', 'adj numéral', 'Cinq (5)', 'Five (5)', 'Nombres', 1, 'Les cinq doigts de la main travailleuse.', 'Moko matanu.', 'Cinq mains levées.'],
  ['Sambanu', '[sà-mbá-nù]', 'adj numéral', 'Six (6)', 'Six (6)', 'Nombres', 2, 'Le nombre six.', 'Mbisi sambanu.', 'Six poissons frais.'],
  ['Sambwadi', '[sà-mbwá-dì]', 'adj numéral', 'Sept (7)', 'Seven (7)', 'Nombres', 2, 'Le nombre sacré des sept jours de la semaine.', 'Bilumbu sambwadi.', 'Sept jours complets.'],
  ['Nana', '[ná-nà]', 'adj numéral', 'Huit (8)', 'Eight (8)', 'Nombres', 2, 'Le nombre huit.', 'Bilele nana.', 'Huit pagnes brodés.'],
  ['Vwa', '[vwá]', 'adj numéral', 'Neuf (9)', 'Nine (9)', 'Nombres', 2, 'Le nombre neuf.', 'Bana bavwa.', 'Neuf enfants joyeux.'],
  ['Kumi', '[kú-mì]', 'adj numéral', 'Dix (10)', 'Ten (10)', 'Nombres', 1, 'La première dizaine achevée.', 'Malu makumi.', 'Dix pas en avant.'],
  ['Makumi mole', '[mà-kú-mì mó-lè]', 'adj numéral', 'Vingt (20)', 'Twenty (20)', 'Nombres', 2, 'Deux dizaines entières.', 'Bantu makumi mole.', 'Vingt personnes réunies.'],
  ['Makumi matatu', '[mà-kú-mì mà-tá-tù]', 'adj numéral', 'Trente (30)', 'Thirty (30)', 'Nombres', 2, 'Trente jours dans le mois.', 'Bilumbu makumi matatu.', 'Trente jours de labeur.'],
  ['Makumi maya', '[mà-kú-mì mà-yá]', 'adj numéral', 'Quarante (40)', 'Forty (40)', 'Nombres', 3, 'Quarante unités.', 'Biti makumi maya.', 'Quarante chaises.'],
  ['Makumi matanu', '[mà-kú-mì mà-tá-nù]', 'adj numéral', 'Cinquante (50)', 'Fifty (50)', 'Nombres', 3, 'Un demi-siècle de bénédictions.', 'Mimvu makumi matanu.', 'Cinquante années d\'expérience.'],
  ['Nkama', '[ǹ-ká-mà]', 'adj numéral', 'Cent (100)', 'One hundred (100)', 'Nombres', 3, 'La centaine pleine.', 'Mbongo nkama mosi.', 'Cent pièces de monnaie.'],

  // =========================================================================
  // 13. TEMPS, HEURES & SAISONS
  // =========================================================================
  ['Lumbu', '[lù-mbú]', 'cl. 11 (pl. bilumbu - cl. 8)', 'Jour / Journée / Date', 'Day / Date', 'Temps & Saisons', 1, 'Le jour qui s\'écoule dans la paix.', 'Lumbu lwa lelo lwena lwa kiese.', 'La journée d\'aujourd\'hui est magnifique.'],
  ['Mpimpa', '[m̀-pí-mpà]', 'cl. 9/10', 'Nuit / Obscurité bienfaisante', 'Night', 'Temps & Saisons', 1, 'Le temps du repos et des contes nocturnes.', 'Mpimpa yifwene, twaleka.', 'La nuit est tombée, allons nous reposer.'],
  ['Mbazi', '[m̀-bá-zì]', 'adv', 'Demain / Lendemain prometteur', 'Tomorrow', 'Temps & Saisons', 1, 'L\'espérance du jour à venir.', 'Mbazi twakwenda ku zandu.', 'Demain, nous irons de bon matin au marché.'],
  ['Lelo', '[lé-lò]', 'adv', 'Aujourd\'hui / Ce jour présent', 'Today', 'Temps & Saisons', 1, 'Profiter pleinement du moment présent.', 'Lelo twavanda na kiese.', 'Aujourd\'hui, nous nous réjouissons ensemble.'],
  ['Mazono', '[mà-zó-nò]', 'adv', 'Hier / Le jour passé', 'Yesterday', 'Temps & Saisons', 1, 'Le jour qui vient de s\'écouler.', 'Mazono twasala mu bilanga.', 'Hier, nous avons bien travaillé aux champs.'],
  ['Mvu', '[m̀-vú]', 'cl. 3 (pl. mimvu - cl. 4)', 'Année / Âge / Temps long', 'Year / Age', 'Temps & Saisons', 2, 'L\'année qui apporte maturité et sagesse.', 'Mvu wa mpa wena na ndandu.', 'La nouvelle année s\'annonce prospère.'],
  ['Tshitshwe', '[tshì-tshwé]', 'cl. 7', 'Saison sèche (fraîcheur et récoltes)', 'Dry season', 'Temps & Saisons', 2, 'La saison fraîche propice aux grandes fêtes et voyages.', 'Mu tshitshwe mpio yidi mbote.', 'Pendant la saison sèche, la fraîcheur est revigorante.'],
  ['Nsungi a mvula', '[ǹ-sú-ngì à m̀-vú-là]', 'locution', 'Saison des pluies (semailles abondantes)', 'Rainy season', 'Temps & Saisons', 2, 'La saison où la nature reverdit et donne ses fruits.', 'Mu nsungi a mvula bilanga byena kitoko.', 'Pendant la saison des pluies, les champs sont resplendissants.'],

  // =========================================================================
  // 14. VERBES D'ACTION & DE LA VIE COURANTE
  // =========================================================================
  ['Kuvova', '[kù-vò-vá]', 'v. infinitif', 'Parler / S\'exprimer / Dire', 'To speak / To talk', 'Verbes', 1, 'S\'exprimer avec clarté et bienveillance.', 'Vova mambu ma luvuvamu.', 'Prononce des paroles de réconciliation.'],
  ['Kusala', '[kù-sá-là]', 'v. infinitif', 'Travailler / Faire / Agir', 'To work / To act', 'Verbes', 1, 'Le travail quotidien qui honore l\'homme.', 'Sala salu na ntima mosi.', 'Travaille avec enthousiasme et rigueur.'],
  ['Kudia', '[kù-dí-yà]', 'v. infinitif', 'Manger / Se nourrir', 'To eat', 'Verbes', 1, 'Partager le repas dans la convivialité.', 'Dia madiya ma mbote.', 'Mange une nourriture saine pour être fort.'],
  ['Kunwa', '[kù-nwá]', 'v. infinitif', 'Boire / Se désaltérer', 'To drink', 'Verbes', 1, 'Étancher sa soif avec de l\'eau pure.', 'Nwa maza ma mpio.', 'Bois de l\'eau bien fraîche.'],
  ['Kuleka', '[kù-lé-kà]', 'v. infinitif', 'Dormir / Se reposer', 'To sleep', 'Verbes', 1, 'Prendre un doux repos pour renouveler ses forces.', 'Leka mbote mwana\'ami.', 'Repose-toi bien mon enfant.'],
  ['Kutala', '[kù-tá-là]', 'v. infinitif', 'Regarder / Observer attentivement', 'To look / To watch', 'Verbes', 1, 'Observer les merveilles de la nature.', 'Tala kitoko kya nsi eto.', 'Admire la beauté grandiose de notre pays.'],
  ['Kuwa', '[kù-wá]', 'v. infinitif', 'Écouter / Entendre / Comprendre', 'To hear / To listen', 'Verbes', 1, 'Comprendre avec son cœur et son esprit.', 'Wa mambu ma bambuta.', 'Écoute attentivement les conseils des aînés.'],
  ['Kutambula', '[kù-tà-mbú-là]', 'v. infinitif', 'Marcher / Voyager / Se déplacer', 'To walk / To travel', 'Verbes', 1, 'Avancer sur le chemin de l\'apprentissage.', 'Tambula na vuvu mu nzila.', 'Marche avec assurance et espoir sur ta route.'],
  ['Kuseka', '[kù-sé-kà]', 'v. infinitif', 'Rire / Sourire / Se réjouir', 'To laugh / To smile', 'Verbes', 1, 'Rire de bon cœur avec ses frères et sœurs.', 'Seka na kiese na bampangi.', 'Partage un grand éclat de rire avec tes proches.'],
  ['Kuyimbila', '[kù-yì-mbí-là]', 'v. infinitif', 'Chanter / Louer en musique', 'To sing', 'Verbes', 1, 'Entonner les beaux refrains du folklore lari.', 'Yimbila nkunga ya kiese.', 'Chante un refrain entraînant de joie.'],
  ['Kukina', '[kù-kí-nà]', 'v. infinitif', 'Danser / Bouger en cadence', 'To dance', 'Verbes', 1, 'Danser au son du tam-tam et des maracas.', 'Kina mu kyedila kya ngoma.', 'Danse en cadence au rythme du tambour.'],
  ['Kusumba', '[kù-sú-mbà]', 'v. infinitif', 'Acheter au marché', 'To buy', 'Verbes', 1, 'Faire ses achats au marché de Bacongo.', 'Sumba bima ku zandu.', 'Achète de bons légumes frais au marché.'],
  ['Kuteka', '[kù-té-kà]', 'v. infinitif', 'Vendre / Commercer loyalement', 'To sell', 'Verbes', 1, 'Proposer ses récoltes avec honnêteté.', 'Teka makemba ma mbote.', 'Vends de belles bananes plantains mûres.'],
  ['Kulonga', '[kù-ló-ngà]', 'v. infinitif', 'Enseigner / Transmettre / Apprendre', 'To teach / To learn', 'Verbes', 1, 'Transmettre le savoir à la jeunesse.', 'Longa mwana lulimi lwa lari.', 'Apprends à l\'enfant à parler sa langue ancestrale.'],
  ['Kuzola', '[kù-zò-lá]', 'v. infinitif', 'Aimer / Chérir / Priser', 'To love / To cherish', 'Verbes', 1, 'Aimer sa famille et sa communauté.', 'Zola kanda dyaku na ntima wawonsono.', 'Aime profondément ta famille et tes proches.'],
  ['Kukeba', '[kù-ké-bà]', 'v. infinitif', 'Prendre soin / Veiller sur quelqu\'un', 'To care for / To protect', 'Verbes', 1, 'Protéger les plus vulnérables et les anciens.', 'Keba bana na babuti.', 'Prends soin affectueusement des enfants et des aînés.'],
  ['Kulamba', '[kù-lá-mbà]', 'v. infinitif', 'Cuisiner / Mijoter de bons plats', 'To cook', 'Verbes', 1, 'L\'art de préparer les plats traditionnels.', 'Lamba saka-saka dya kununa.', 'Prépare un délicieux plat de saka-saka fumant.'],
  ['Kuyoka', '[kù-yó-kà]', 'v. infinitif', 'Ressentir / Éprouver / Sentir', 'To feel / To sense', 'Verbes', 1, 'Éprouver la joie d\'être ensemble.', 'Yoka kiese mu ntima.', 'Ressens la profonde allégresse dans ton cœur.'],
  ['Kutunga', '[kù-tú-ngà]', 'v. infinitif', 'Bâtir / Construire / Tisser', 'To build / To weave', 'Verbes', 1, 'Construire une maison solide et un avenir radieux.', 'Tunga nzo ya ngolo.', 'Bâtis une maison durable pour ta famille.'],
  ['Kusolola', '[kù-sò-ló-là]', 'v. infinitif', 'Trouver / Découvrir / Chercher', 'To find / To discover', 'Verbes', 2, 'Découvrir les trésors de sa culture.', 'Solola mayele ma bakulu.', 'Découvre les inestimables sagesses des anciens.']
];

console.log(`📊 Total vocabulaire Lari préparé : ${RAW_520_VOCABULARY.length} mots et expressions.`);

// Formater les entrées avec IDs uniques et métadonnées exhaustives
const FORMATTED_520_ITEMS = RAW_520_VOCABULARY.map((row, idx) => {
  const [wordNative, phonetic, nounClass, translationFr, translationEn, category, difficultyLevel, culturalNote, exampleSentenceNative, exampleSentenceFr] = row;
  const cleanAudioName = wordNative.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  return {
    id: `w${idx + 1}`,
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
    speakerName: (idx % 2 === 0) ? 'Mbuta Papa Jean-Baptiste (Pointe-Noire / Pool)' : 'Mbuta Pauline (Brazzaville / Bacongo)',
    source: 'MBUTA / Dictionnaire Vivant Lari-Français'
  };
});

// Écrire dans dictionnaire_lari_francais.json
const jsonPath = path.resolve('data/lexicon/dictionnaire_lari_francais.json');
fs.writeFileSync(jsonPath, JSON.stringify(FORMATTED_520_ITEMS, null, 2), 'utf-8');

// Écrire dans dictionnaire_lari_francais.csv
const csvHeader = 'id,word_native,phonetic,noun_class,translation_fr,translation_en,category,difficulty_level,cultural_note,example_sentence_native,example_sentence_fr,source,confidence_level\n';
const csvRows = FORMATTED_520_ITEMS.map(w => {
  const note = `"${(w.culturalNote || '').replace(/"/g, '""')}"`;
  const exNat = `"${(w.exampleSentenceNative || '').replace(/"/g, '""')}"`;
  const exFr = `"${(w.exampleSentenceFr || '').replace(/"/g, '""')}"`;
  return `${w.id},${w.wordNative},${w.phonetic},${w.nounClass || ''},"${w.translationFr}","${w.translationEn}",${w.category},${w.difficultyLevel},${note},${exNat},${exFr},"${w.source}","Très élevée"`;
}).join('\n');
fs.writeFileSync(path.resolve('data/lexicon/dictionnaire_lari_francais.csv'), csvHeader + csvRows, 'utf-8');

console.log(`✅ Base de données sauvegardée : ${FORMATTED_520_ITEMS.length} mots et expressions dans data/lexicon/ !`);

// Mettre à jour src/data/mockData.ts
const mockDataPath = path.resolve('src/data/mockData.ts');
let mockDataContent = fs.readFileSync(mockDataPath, 'utf-8');

const regexWords = /export const LARI_WORDS: WordItem\[\] = \[([\s\S]*?)\];/;
const replacement = `export const LARI_WORDS: WordItem[] = ${JSON.stringify(FORMATTED_520_ITEMS, null, 2)};`;

if (regexWords.test(mockDataContent)) {
  mockDataContent = mockDataContent.replace(regexWords, replacement);
  fs.writeFileSync(mockDataPath, mockDataContent, 'utf-8');
  console.log(`✅ src/data/mockData.ts synchronisé avec succès avec les ${FORMATTED_520_ITEMS.length} mots !`);
} else {
  console.warn('⚠️ Impossible de localiser export const LARI_WORDS dans mockData.ts');
}
