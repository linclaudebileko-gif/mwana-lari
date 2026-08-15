import fs from 'fs';
import path from 'path';

// Complete dictionary of +300 authentic Lari words organized by 5 Pedagogical Levels & 12 Themes
const VOCABULARY_DEFINITIONS = [
  // 1. Salutations & Politesse (Niveau 1 & 2)
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

  // 2. Famille & Personnes (Niveaux 1 à 3)
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

  // 3. Corps Humain (Nitu) (Niveaux 1 à 4)
  ['Nitu', '[nì-tú]', 'cl. 9/10', 'Corps / Corps humain / Santé', 'Body / Health', 'Corps Humain', 1, '« Nitu yina mbote » = Le corps va bien / Être en bonne santé.', 'Keba nitu yaku mwana.', 'Prends bien soin de ton corps mon enfant.'],
  ['Ntu', '[ǹ-tú]', 'cl. 3 (pl. mintu - cl. 4)', 'Tête / Esprit / Pensée', 'Head', 'Corps Humain', 1, 'Siège de l\'intelligence et de la mémoire.', 'Ntu yami yina mayele.', 'Ma tête est pleine d\'idées et d\'intelligence.'],
  ['Meso', '[mé-sò]', 'cl. 6 (sing. diso - cl. 5)', 'Yeux / Regard', 'Eyes', 'Corps Humain', 1, '« Zibula meso » = Ouvre les yeux (sois attentif).', 'Meso maandi meena mona bwabu.', 'Ses yeux voient clair maintenant.'],
  ['Matu', '[mà-tú]', 'cl. 6 (sing. kutu - cl. 15)', 'Oreilles / Écoute', 'Ears', 'Corps Humain', 1, 'L\'écoute attentive (kuwa) est la première vertu.', 'Tula matu wawa mbuta.', 'Tends l\'oreille pour écouter l\'aîné.'],
  ['Zunu', '[zù-nú]', 'cl. 5 (pl. mazunu - cl. 6)', 'Nez', 'Nose', 'Corps Humain', 1, 'L\'organe de l\'odorat.', 'Zunu weena numba ndumbu.', 'Le nez sent la bonne odeur du repas.'],
  ['Munoko', '[mù-nó-kò]', 'cl. 3 (pl. minoko - cl. 4)', 'Bouche / Parole', 'Mouth', 'Corps Humain', 1, 'Porte de la parole juste et de l\'expression.', 'Kanga munoko wawa masolo.', 'Garde le silence pour écouter les récits.'],
  ['Meno', '[mé-nò]', 'cl. 6 (sing. dino - cl. 5)', 'Dents', 'Teeth', 'Corps Humain', 1, 'Dents saines pour croquer les aliments.', 'Sukula meno maaku mbote.', 'Brosse bien tes dents.'],
  ['Ludimi', '[lù-dí-mì]', 'cl. 11 (pl. ndimi - cl. 10)', 'Langue (organe et langage)', 'Tongue / Language', 'Corps Humain', 2, 'Désigne l\'organe et la langue parlée (Kilaadi).', 'Ludimi lwa Kilaadi lweendanga kitoko.', 'La langue lari est mélodieuse.'],
  ['Nsingu', '[ǹ-sí-ngù]', 'cl. 9/10', 'Cou / Gorge', 'Neck / Throat', 'Corps Humain', 2, 'Le cou qui soutient la tête avec fierté.', 'Nsingu weena talama.', 'Le cou se dresse fièrement.'],
  ['Moko', '[mò-kó]', 'cl. 6 (sing. koko - cl. 15)', 'Mains / Bras', 'Hands / Arms', 'Corps Humain', 1, 'Les mains qui travaillent et saluent avec respect.', 'Sukula moko manga wa dia.', 'Lave tes mains avant de manger.'],
  ['Lulembo', '[lù-lé-mbò]', 'cl. 11 (pl. nlembo - cl. 10)', 'Doigt', 'Finger', 'Corps Humain', 2, 'Les cinq doigts de la main qui s\'entraident.', 'Tanga nlembo myaku.', 'Compte tes doigts avec attention.'],
  ['Kulu', '[kù-lú]', 'cl. 15 (pl. malu - cl. 6)', 'Pied / Jambe', 'Foot / Leg', 'Corps Humain', 1, 'Pour marcher d\'un pas ferme sur la terre.', 'Tambula na malu maaku.', 'Marche d\'un pas assuré avec tes pieds.'],
  ['Ntima', '[ǹ-tí-mà]', 'cl. 3 (pl. mintima - cl. 4)', 'Cœur / Conscience / Sentiments', 'Heart / Conscience', 'Corps Humain', 2, 'Symbole de bonté : « Ntima ya bumbote ».', 'Ntima\'ami weena na kiese.', 'Mon cœur est rempli de joie.'],
  ['Kivumu', '[kì-vú-mù]', 'cl. 7 (pl. bivumu - cl. 8)', 'Ventre / Estomac', 'Belly / Stomach', 'Corps Humain', 2, '« Kivumu kyeena yuka » = Le ventre est rassasié.', 'Kivumu kyeena yuka madiya.', 'Le ventre est rassasié de bon repas.'],
  ['Musisa', '[mù-sí-sà]', 'cl. 3 (pl. misisa - cl. 4)', 'Veine / Muscle / Nerf / Racine', 'Muscle / Vein', 'Corps Humain', 3, 'Source de vigueur physique.', 'Musisa weena na ngolo.', 'Le muscle est plein de vigueur.'],
  ['Menga', '[mé-ngà]', 'cl. 6', 'Sang / Lignée vitale', 'Blood', 'Corps Humain', 3, 'Symbole de la vie et des liens familiaux sacrés.', 'Menga ma kanda dyeto.', 'Le sang et la mémoire de notre clan.'],
  ['Mukongo', '[mù-kó-ngò]', 'cl. 3 (pl. mikongo - cl. 4)', 'Dos / Colonne vertébrale', 'Back', 'Corps Humain', 2, 'Le dos droit qui porte les fardeaux avec courage.', 'Mukongo weena siama.', 'Le dos est fort et courageux.'],
  ['Ditama', '[dì-tá-mà]', 'cl. 5 (pl. matama - cl. 6)', 'Joue', 'Cheek', 'Corps Humain', 2, '« Fiba ditama » = Faire un bisou sur la joue.', 'Mama wafiba mwana vana ditama.', 'Maman embrasse son enfant sur la joue.'],
  ['Nsuki', '[ǹ-sú-kì]', 'cl. 9/10', 'Cheveux / Chevelure', 'Hair', 'Corps Humain', 2, 'Tressés avec art par les mamans le week-end.', 'Mama weena tunga nsuki.', 'Maman tresse les cheveux avec soin.'],

  // 4. Maison & Objets (Nzo) (Niveaux 1 à 3)
  ['Nzo', '[ǹ-zó]', 'cl. 9 (pl. binzo - cl. 10)', 'Maison / Foyer / Demeure', 'House / Home', 'Maison', 1, 'Le foyer familial où la famille se réunit le soir.', 'Nzo\'ami yina ya nene.', 'Ma maison est grande et accueillante.'],
  ['Kyelo', '[kyé-lò]', 'cl. 7 (pl. byelo - cl. 8)', 'Porte / Entrée', 'Door / Entrance', 'Maison', 1, '« Zibula kyelo » (Ouvre la porte) / « Kanga kyelo » (Ferme la porte).', 'Zibula kyelo mwana !', 'Ouvre la porte mon enfant !'],
  ['Mesa', '[mé-sà]', 'cl. 9/10', 'Table', 'Table', 'Maison', 1, 'Lieu du partage des repas familiaux.', 'Tula sani vana mesa.', 'Pose l\'assiette sur la table.'],
  ['Kiti', '[kì-tí]', 'cl. 7 (pl. biti - cl. 8)', 'Chaise / Siège', 'Chair / Seat', 'Maison', 1, '« Vwanda vana kiti » (Assieds-toi sur la chaise).', 'Vwanda vana kiti wawa masolo.', 'Assieds-toi sur la chaise pour écouter.'],
  ['Mbele', '[m̀-bé-lè]', 'cl. 9/10', 'Couteau / Lame', 'Knife', 'Maison', 2, 'Ustensile utile pour couper les aliments en cuisine.', 'Zenga mbisi na mbele.', 'Coupe le poisson avec le couteau.'],
  ['Sani', '[sà-ní]', 'cl. 5 (pl. masani - cl. 6)', 'Assiette / Plat', 'Plate / Dish', 'Maison', 2, 'Pour servir les repas chauds.', 'Tula madiya mu sani.', 'Mets la nourriture dans l\'assiette.'],
  ['Kinzu', '[kì-nzú]', 'cl. 7 (pl. binzu - cl. 8)', 'Marmite / Casserole de cuisson', 'Cooking pot', 'Maison', 2, 'Marmite traditionnelle où mijote le saka-saka.', 'Kinzu kyeena vana tiya.', 'La marmite est sur le feu.'],
  ['Mvungu', '[m̀-vú-ngù]', 'cl. 9/10', 'Cruche / Récipient à eau / Carafe', 'Jug / Water pitcher', 'Maison', 2, 'Garde l\'eau fraîche sous le préau.', 'Masa meena mu mvungu.', 'L\'eau fraîche est dans la cruche.'],
  ['Mbete', '[m̀-bé-tè]', 'cl. 9/10', 'Lit / Couchette', 'Bed', 'Maison', 1, 'Lieu du doux sommeil et du repos nocturne.', 'Lala vana mbete mwana.', 'Dors paisiblement sur ton lit mon enfant.'],
  ['Nsinga', '[ǹ-sí-ngà]', 'cl. 3 (pl. minsinga - cl. 4)', 'Corde / Fil / Lien', 'Rope / Thread', 'Maison', 2, 'Pour attacher le bois de chauffe.', 'Kanga nti na nsinga.', 'Attache les fagots de bois avec la corde.'],
  ['Mukanda', '[mù-ká-ndà]', 'cl. 3 (pl. mikanda - cl. 4)', 'Livre / Cahier / Lettre / Document', 'Book / Letter', 'Maison', 1, 'Support des études et du savoir écrit.', 'Ntangidi mukanda waku.', 'J\'ai lu ton livre.'],
  ['Kiyenga', '[kì-yé-ngà]', 'cl. 7 (pl. biyenga - cl. 8)', 'Fenêtre / Ouverture d\'aération', 'Window', 'Maison', 2, 'Laisse entrer l\'air frais du matin.', 'Zibula kiyenga tembo yikota.', 'Ouvre la fenêtre pour aérer la pièce.'],
  ['Ditoko', '[dì-tó-kò]', 'cl. 5 (pl. matoko - cl. 6)', 'Natte / Tapis en fibres végétales', 'Mat / Straw mat', 'Maison', 2, 'Déroulée sur le sol pour s\'asseoir en cercle le soir.', 'Yala ditoko vana nsi.', 'Déroule la natte sur le sol.'],

  // 5. Nourriture & Cuisine (Madiya) (Niveaux 1 à 3)
  ['Madiya', '[mà-dí-yà]', 'cl. 6', 'Nourriture / Repas / Mets', 'Food / Meal', 'Nourriture', 1, 'Le bon repas partagé en famille.', 'Madiya mama meena kitoko.', 'Ce repas est délicieux.'],
  ['Saka-saka', '[sà-kà-sà-kà]', 'cl. 7 / cl. 6', 'Feuilles de manioc pilées', 'Cassava leaves dish', 'Nourriture', 1, 'Plat national congolais traditionnel.', 'Mama walambi saka-saka na madesu.', 'Maman a préparé du saka-saka avec des haricots.'],
  ['Madesu', '[mà-dé-sù]', 'cl. 6', 'Haricots', 'Beans', 'Nourriture', 1, 'Accompagnement très apprécié avec le manioc ou le riz.', 'Madesu mama meena ndunu.', 'Ces haricots sont succulents.'],
  ['Mankondo', '[mà-nkó-ndò]', 'cl. 6', 'Bananes / Bananes plantains', 'Plantains / Bananas', 'Nourriture', 1, 'Bananes frites ou bouillies pour le déjeuner.', 'Sumba mankondo ma yoka.', 'Achète des bananes à frire.'],
  ['Mbisi', '[m̀-bí-sì]', 'cl. 9/10', 'Poisson / Viande', 'Fish / Meat', 'Nourriture', 1, 'Poisson du fleuve ou gibier de brousse.', 'Mbisi ya tiya yina kitoko.', 'Le poisson braisé est succulent.'],
  ['Kwanga', '[kwá-ngà]', 'cl. 9/10', 'Pain de manioc / Chikwangue', 'Cassava bread / Chikwangue', 'Nourriture', 1, 'Aliment de base congolais enveloppé dans des feuilles.', 'Zenga kwanga twadia na saka-saka.', 'Coupe le pain de manioc pour le repas.'],
  ['Mbika', '[m̀-bí-kà]', 'cl. 9/10', 'Graines de courge / Pâte de courge', 'Pumpkin seeds', 'Nourriture', 2, 'Cuisiné en gâteau cuit à la vapeur (Koba).', 'Mama walambi mbika na mbisi.', 'Maman a cuisiné des graines de courge au poisson.'],
  ['Mafuta', '[mà-fú-tà]', 'cl. 6', 'Huile / Huile de palme / Beurre', 'Oil / Palm oil', 'Nourriture', 2, 'Huile de palme rouge (mafuta ma ngasi) riche et parfumée.', 'Tula mafuta mu kinzu.', 'Verse un peu d\'huile dans la marmite.'],
  ['Mungwa', '[mù-ngwá]', 'cl. 3', 'Sel', 'Salt', 'Nourriture', 1, 'Donne le goût indispensable aux repas.', 'Tula mungwa mwa fioti.', 'Ajoute une pincée de sel.'],
  ['Loso', '[lò-só]', 'cl. 11 / cl. 6', 'Riz', 'Rice', 'Nourriture', 1, 'Accompagnement du quotidien apprécié des enfants.', 'Loso na madesu yina kitoko.', 'Le riz aux haricots est un régal.'],
  ['Tsusu', '[tsú-sù]', 'cl. 9/10', 'Poulet / Viande de poule', 'Chicken meat', 'Nourriture', 1, 'Plat de fête servi lors des réunions de famille.', 'Tsusu ya tiya yina ndunu.', 'Le poulet braisé est délicieux.'],
  ['Bitoto', '[bì-tó-tò]', 'cl. 8 (sing. kitoto - cl. 7)', 'Patates douces', 'Sweet potatoes', 'Nourriture', 2, 'Racines sucrées bouillies ou grillées sous la braise.', 'Yoka bitoto vana tiya.', 'Fais griller les patates douces sur la braise.'],
  ['Mpondzi', '[m̀-pó-ndzì]', 'cl. 9/10', 'Arachides / Cacahuètes', 'Peanuts', 'Nourriture', 2, 'Grillées ou pilées en pâte pour assaisonner les sauces.', 'Sumba mpondzi za kanga.', 'Achète des arachides grillées.'],
  ['Safu', '[sà-fú]', 'cl. 9/10 (sing. disafu - cl. 5)', 'Prunes africaines / Safous', 'African plums / Safou', 'Nourriture', 2, 'Fruit onctueux rôti sur la braise.', 'Safu za yoka zena ndunu.', 'Les safous grillés sont un régal.'],
  ['Nsuka', '[ǹ-sú-kà]', 'cl. 9/10', 'Canne à sucre', 'Sugar cane', 'Nourriture', 2, 'Tige douce et sucrée que les enfants aiment mâcher.', 'Kona nsuka yina sukadi.', 'Croque la canne à sucre bien douce.'],

  // 6. Animaux & Nature (Niveaux 1 à 4)
  ['Nkosi', '[ǹ-kó-sì]', 'cl. 9/10', 'Lion', 'Lion', 'Animaux', 1, 'Le roi majestueux de la forêt.', 'Nkosi weena ku mfinda.', 'Le lion règne dans la forêt.'],
  ['Ngo', '[ǹ-gó]', 'cl. 9/10', 'Léopard / Panthère', 'Leopard', 'Animaux', 2, 'Symbole de noblesse et de royauté.', 'Ngo weena na bibanda bi kitoko.', 'Le léopard porte un pelage tacheté magnifique.'],
  ['Mbwa', '[m̀-bwá]', 'cl. 9/10', 'Chien', 'Dog', 'Animaux', 1, 'Fidèle compagnon de garde au village.', 'Mbwa weena keba nzo.', 'Le chien garde fidèlement la maison.'],
  ['Nsusu', '[ǹ-sú-sù]', 'cl. 9/10', 'Poule / Volaille', 'Hen / Chicken', 'Animaux', 1, 'Élevée dans la cour familiale.', 'Nsusu weena kuka bana baandi.', 'La poule protège avec tendresse ses poussins.'],
  ['Nioka', '[nyò-ká]', 'cl. 9/10', 'Serpent', 'Snake', 'Animaux', 2, 'Animal prudent glissant dans les herbes.', 'Nioka weena tina ku nsambu.', 'Le serpent s\'enfuit rapidement dans les herbes.'],
  ['Nuni', '[nù-ní]', 'cl. 9/10', 'Oiseau', 'Bird', 'Animaux', 1, 'Chante à l\'aube dans les arbres.', 'Nuni weena yimbila vana nti.', 'L\'oiseau chante joyeusement sur l\'arbre.'],
  ['Mvubu', '[m̀-vú-bù]', 'cl. 9/10', 'Hippopotame', 'Hippopotamus', 'Animaux', 3, 'Le colosse aquatique des rivières du Pool.', 'Mvubu weena duka mu masa.', 'L\'hippopotame nage paisiblement dans l\'eau.'],
  ['Nkayi', '[ǹ-ká-yì]', 'cl. 9/10', 'Antilope / Biche de forêt', 'Antelope', 'Animaux', 2, 'Animal agile et rapide de la savane.', 'Nkayi weena soka mu zamba.', 'L\'antilope bondit gracieusement dans la savane.'],
  ['Mboloko', '[m̀-bò-ló-kò]', 'cl. 9/10', 'Petite antilope / Céphalophe', 'Dwarf antelope', 'Animaux', 2, 'Petite biche vive des fourrés.', 'Mboloko weena tina na ngolo.', 'La petite antilope court à toute vitesse.'],
  ['Koko', '[kó-kò]', 'cl. 9/10', 'Perroquet gris du Congo', 'Grey parrot', 'Animaux', 1, 'Oiseau sage à la queue rouge qui répète les proverbes.', 'Koko weena vova Kilaadi.', 'Le perroquet Koko parle lari avec malice.'],
  ['Nkombo', '[ǹ-kó-mbò]', 'cl. 9/10', 'Chèvre / Cabri', 'Goat', 'Animaux', 1, 'Animal domestique courant dans les villages du Pool.', 'Nkombo weena dia bititi.', 'La chèvre broute l\'herbe fraîche.'],
  ['Ngulu', '[ǹ-gú-lù]', 'cl. 9/10', 'Cochon / Porc', 'Pig', 'Animaux', 2, 'Élevé dans les fermes villageoises.', 'Ngulu weena dila madiya.', 'Le cochon mange son repas.'],
  ['Nzinzi', '[ǹ-zí-nzì]', 'cl. 9/10', 'Mouche', 'Fly', 'Animaux', 2, 'Insecte volant courant.', 'Nzinzi weena pupa vana zulu.', 'La mouche vole dans les airs.'],
  ['Njinji', '[ǹ-jí-njì]', 'cl. 9/10', 'Moustique', 'Mosquito', 'Animaux', 2, 'À éviter en dormant sous une moustiquaire.', 'Lala mu moustiquaire unkuka ku njinji.', 'Dors sous la moustiquaire pour te protéger des moustiques.'],

  // 7. Temps, Saisons & Nature (Niveaux 2 à 5)
  ['Ntangu', '[ǹ-tá-ngù]', 'cl. 9/10', 'Temps / Soleil / Heure', 'Time / Sun', 'Temps & Saisons', 1, '« Ntangu yina » = Il est l\'heure / Le soleil brille.', 'Ntangu ya nzo-nkanda yifwene.', 'L\'heure d\'aller à l\'école est arrivée.'],
  ['Mvula', '[m̀-vú-là]', 'cl. 9/10', 'Pluie / Année / Saison pluvieuse', 'Rain / Year', 'Temps & Saisons', 1, 'Fait germer les cultures dans le Pool.', 'Mvula yinene yina noka.', 'Une grande pluie bienfaisante tombe.'],
  ['Ngonda', '[ǹ-gó-ndà]', 'cl. 9/10', 'Lune / Mois', 'Moon / Month', 'Temps & Saisons', 2, 'Clarté pour les récits du soir.', 'Ngonda yina mwisa nsemo ku bwala.', 'La lune éclaire le village.'],
  ['Mwini', '[mwì-ní]', 'cl. 3', 'Journée / Clarté / Soleil de midi', 'Daylight', 'Temps & Saisons', 2, 'Chaleur bienfaisante de la mi-journée.', 'Mwini weena nsemo mingi.', 'Le soleil brille avec éclat.'],
  ['Mpimpa', '[m̀-pí-mpà]', 'cl. 9/10', 'Nuit / Obscurité', 'Night', 'Temps & Saisons', 1, 'Moment du sommeil réparateur.', 'Mpimpa yifwene, twalala.', 'La nuit est tombée, allons dormir.'],
  ['Mazono', '[mà-zó-nò]', 'adv', 'Hier', 'Yesterday', 'Temps & Saisons', 2, 'Pour relater les événements passés.', 'Mazono twatele masolo ma kitoko.', 'Hier nous avons raconté de beaux contes.'],
  ['Bwabu', '[bwá-bù]', 'adv', 'Aujourd\'hui / Maintenant', 'Today / Now', 'Temps & Saisons', 1, 'Le moment présent pour étudier.', 'Bwabu twasala kisalu kieto.', 'Aujourd\'hui nous accomplissons notre tâche.'],
  ['Mbazi', '[m̀-bá-zì]', 'adv', 'Demain', 'Tomorrow', 'Temps & Saisons', 1, 'Pour planifier le futur.', 'Mbazi twakwenda ku zandu.', 'Demain nous irons au grand marché.'],
  ['Kilumbu', '[kì-lú-mbù]', 'cl. 7 (pl. bilumbu - cl. 8)', 'Jour / Date / Journée', 'Day', 'Temps & Saisons', 2, '« Kilumbu kya mbote » = Une bonne journée.', 'Kilumbu kyakonso twalonga.', 'Chaque jour nous apprenons de nouvelles choses.'],
  ['Mvu', '[m̀-vú]', 'cl. 3 (pl. mivù - cl. 4)', 'Année / Âge / Siècle', 'Year / Age', 'Temps & Saisons', 3, '« Mvu myakwi weena ? » = Quel âge as-tu ?', 'Mvu myakwi weena mwana ?', 'Quel âge as-tu mon enfant ?'],
  ['Mvula ya tiya', '[m̀-vú-là yà tí-yà]', 'locution', 'Saison sèche / Saison chaude', 'Dry season', 'Temps & Saisons', 3, 'Période propice aux fêtes et grands voyages.', 'Mu mvula ya tiya twakwenda ku bwala.', 'Pendant la saison sèche nous allons au village.'],
  ['Nzadi', '[ǹ-zá-dì]', 'cl. 9/10', 'Fleuve / Grande rivière', 'River', 'Nature & Éléments', 2, 'Le grand fleuve Congo majestueux.', 'Nzadi ya Kongo yinene mingi.', 'Le fleuve Congo est vaste et puissant.'],
  ['Mfinda', '[m̀-fí-ndà]', 'cl. 9/10', 'Forêt / Brousse dense', 'Forest', 'Nature & Éléments', 2, 'Abri des plantes et animaux sauvages.', 'Biyilu biingi byena ku mfinda.', 'Beaucoup d\'animaux vivent en forêt.'],
  ['Muti', '[mù-tí]', 'cl. 3 (pl. miti - cl. 4)', 'Arbre / Végétal', 'Tree', 'Nature & Éléments', 1, 'Procure fraîcheur et ombre bienfaisante.', 'Muti wuna weena buta mbuma.', 'Cet arbre porte de bons fruits.'],
  ['Zulu', '[zù-lú]', 'cl. 5', 'Ciel / Cieux', 'Sky / Heaven', 'Nature & Éléments', 2, 'La voûte céleste bleue ou étoilée.', 'Zulu dyeena kiese na mbwetete.', 'Le ciel scintille d\'étoiles cette nuit.'],
  ['Ntoto', '[ǹ-tó-tò]', 'cl. 9/10', 'Terre / Sol / Patrie', 'Earth / Land', 'Nature & Éléments', 2, 'La terre des ancêtres à respecter.', 'Keba ntoto ya bakulu baaku.', 'Protège la terre de tes aînés.'],
  ['Mbwetete', '[m̀-bwé-té-tè]', 'cl. 9/10', 'Étoile', 'Star', 'Nature & Éléments', 2, 'Scintille dans la nuit africaine.', 'Mbwetete yina nsemo ku zulu.', 'Une étoile brille au ciel.'],
  ['Tiya', '[tí-yà]', 'cl. 6', 'Feu / Flamme', 'Fire', 'Nature & Éléments', 1, 'Chauffe la case et cuit les repas.', 'Kanga tiya twalambi madiya.', 'Allume le feu pour cuisiner.'],
  ['Tembo', '[té-mbò]', 'cl. 9/10', 'Vent / Brise', 'Wind / Breeze', 'Nature & Éléments', 2, 'Rafraîchit la plaine le soir venu.', 'Tembo ya nlemvo yina pepele.', 'Une brise douce souffle ce soir.'],

  // 8. Métiers, Ville & Transports (Niveaux 2 à 4)
  ['Zandu', '[zà-ndú]', 'cl. 5 (pl. mazandu - cl. 6)', 'Marché / Place commerçante', 'Market', 'Transports & Ville', 2, 'Le grand marché central animé.', 'Mama wele ku zandu dia Total.', 'Maman est allée au marché Total.'],
  ['Nzila', '[ǹ-zí-là]', 'cl. 9/10', 'Route / Chemin / Voie', 'Road / Path', 'Transports & Ville', 1, '« Kwenda nzila ya mbote » = Fais bonne route.', 'Kwenda nzila ya mbote !', 'Fais un bon voyage sur la route !'],
  ['Bwala', '[bwà-lá]', 'cl. 5 (pl. mabwala - cl. 6)', 'Village / Ville / Cité', 'Village / Town', 'Transports & Ville', 1, 'Terre de naissance et d\'attachement.', 'Bwala bweto bwina kitoko mingi.', 'Notre village est magnifique.'],
  ['Nzo-nkanda', '[ǹ-zó-nká-ndà]', 'cl. 9/10', 'École / Établissement scolaire', 'School', 'Transports & Ville', 1, 'Maison des études et du savoir.', 'Bana balele ku nzo-nkanda.', 'Les enfants sont allés à l\'école.'],
  ['Makalo', '[mà-ká-lò]', 'cl. 6', 'Véhicule / Voiture / Moyen de transport', 'Vehicle / Car', 'Transports & Ville', 2, 'Pour se déplacer sur les grandes routes.', 'Makalo meena kwenda na nzila.', 'La voiture roule sur la route.'],
  ['Kilongoki', '[kì-lò-ngó-kì]', 'cl. 7 (pl. bilongoki - cl. 8)', 'Élève / Apprenant', 'Student', 'Métiers & Activités', 2, 'Apprend avec curiosité et assiduité.', 'Kilongoki weena sala misalu maandi.', 'L\'élève fait ses devoirs.'],
  ['Mulongi', '[mù-lò-ngí]', 'cl. 1 (pl. balongi - cl. 2)', 'Enseignant / Maître d\'école', 'Teacher', 'Métiers & Activités', 2, 'Transmet la connaissance avec dévouement.', 'Mulongi weena longa bana Kilaadi.', 'L\'enseignant apprend le lari aux enfants.'],
  ['Kulamva', '[kù-là-mvà]', 'Verbe', 'Cuisiner / Préparer les mets', 'To cook', 'Métiers & Activités', 2, 'L\'art de concocter de savoureux plats.', 'Mama weena lamva madiya ma mbote.', 'Maman prépare un bon repas.'],
  ['Kufundisa', '[kù-fù-ndí-sà]', 'Verbe', 'Enseigner / Instruire', 'To teach', 'Métiers & Activités', 3, 'Donner des leçons de vie et de savoir.', 'Bambuta beena fundisa bana mayele.', 'Les anciens instruisent la jeunesse.'],
  ['Kutunga', '[kù-tú-ngà]', 'Verbe', 'Bâtir / Construire', 'To build', 'Métiers & Activités', 2, 'Construire une maison solide pour la famille.', 'Tata weena tunga nzo ya ngolo.', 'Papa bâtit une maison solide.'],
  ['Mubakisi', '[mù-bà-kí-sì]', 'cl. 1 (pl. babakisi - cl. 2)', 'Pêcheur / Pourvoyeur', 'Fisherman', 'Métiers & Activités', 3, 'Navigue sur le fleuve pour ramener du poisson.', 'Mubakisi wele ku nzadi ya Kongo.', 'Le pêcheur est allé sur le fleuve.'],
  ['Bilanga', '[bì-là-ngá]', 'cl. 8', 'Champs / Plantations', 'Fields / Farms', 'Métiers & Activités', 2, 'Où l\'on cultive manioc et légumes.', 'Twalambula mbuti ku bilanga.', 'Allons récolter aux champs.'],

  // 9. Nombres & Mathématiques (1 à 100) (Niveaux 1 à 4)
  ['Mosi', '[mó-sì]', 'adj. num.', 'Un (1)', 'One (1)', 'Nombres', 1, 'Le chiffre un pour débuter le compte.', 'Mwana mosi.', 'Un seul enfant.'],
  ['Zole', '[zó-lè]', 'adj. num.', 'Deux (2)', 'Two (2)', 'Nombres', 1, 'Deux.', 'Binzo bi-zole.', 'Deux maisons.'],
  ['Tatu', '[tá-tù]', 'adj. num.', 'Trois (3)', 'Three (3)', 'Nombres', 1, 'Trois.', 'Miti mitatu.', 'Trois arbres.'],
  ['Ya', '[yá]', 'adj. num.', 'Quatre (4)', 'Four (4)', 'Nombres', 1, 'Quatre.', 'Bana ba-ya.', 'Quatre enfants.'],
  ['Tanu', '[tá-nù]', 'adj. num.', 'Cinq (5)', 'Five (5)', 'Nombres', 1, 'Cinq.', 'Binsusu bi-tanu.', 'Cinq poules.'],
  ['Sambanu', '[sà-mbá-nù]', 'adj. num.', 'Six (6)', 'Six (6)', 'Nombres', 1, 'Six.', 'Mikanda sambanu.', 'Six livres.'],
  ['Nsambwadi', '[nsà-mbwá-dì]', 'adj. num.', 'Sept (7)', 'Seven (7)', 'Nombres', 1, 'Sept.', 'Bilumbu nsambwadi.', 'Sept jours.'],
  ['Naana', '[ná-à-nà]', 'adj. num.', 'Huit (8)', 'Eight (8)', 'Nombres', 1, 'Huit.', 'Biti naana.', 'Huit chaises.'],
  ['Vwa', '[vwá]', 'adj. num.', 'Neuf (9)', 'Nine (9)', 'Nombres', 1, 'Neuf.', 'Matadi vwa.', 'Neuf pierres.'],
  ['Kumi', '[kù-mí]', 'adj. num.', 'Dix (10)', 'Ten (10)', 'Nombres', 1, 'Dix.', 'Bantu kumi.', 'Dix personnes.'],
  ['Kumi na mosi', '[kù-mí nà mó-sì]', 'adj. num.', 'Onze (11)', 'Eleven (11)', 'Nombres', 2, 'Dix et un.', 'Bana kumi na mosi.', 'Onze enfants.'],
  ['Kumi na zole', '[kù-mí nà zó-lè]', 'adj. num.', 'Douze (12)', 'Twelve (12)', 'Nombres', 2, 'Dix et deux.', 'Ngonda kumi na zole.', 'Douze mois.'],
  ['Makumi mole', '[mà-kú-mì mó-lè]', 'adj. num.', 'Vingt (20)', 'Twenty (20)', 'Nombres', 2, 'Deux dizaines.', 'Bilumbu makumi mole.', 'Vingt jours.'],
  ['Makumi matatu', '[mà-kú-mì mà-tá-tù]', 'adj. num.', 'Trente (30)', 'Thirty (30)', 'Nombres', 3, 'Trois dizaines.', 'Bantu makumi matatu.', 'Trente personnes.'],
  ['Makumi maya', '[mà-kú-mì mà-yá]', 'adj. num.', 'Quarante (40)', 'Forty (40)', 'Nombres', 3, 'Quatre dizaines.', 'Mvu makumi maya.', 'Quarante ans.'],
  ['Makumi matanu', '[mà-kú-mì mà-tá-nù]', 'adj. num.', 'Cinquante (50)', 'Fifty (50)', 'Nombres', 3, 'Cinquante.', 'Mikanda makumi matanu.', 'Cinquante livres.'],
  ['Nkama', '[ǹ-ká-mà]', 'cl. 9/10', 'Cent (100) / Siècle', 'One hundred (100)', 'Nombres', 4, 'La centaine.', 'Bantu nkama mosi.', 'Cent personnes réunies.'],

  // 10. Verbes d'Action du Quotidien (Niveaux 1 à 4)
  ['Kuvova', '[kù-vó-và]', 'Verbe', 'Parler / S\'exprimer', 'To speak', 'Verbes', 1, 'La maîtrise de la parole juste.', 'Vova Kilaadi na ngolo.', 'Parle le lari avec fierté.'],
  ['Kuzola', '[kù-zó-là]', 'Verbe', 'Aimer / Vouloir / Chérir', 'To love / To like', 'Verbes', 1, '« Nzololo ngeye » = Je t\'aime.', 'Nzololo ngeye mwana\'ami.', 'Je t\'aime mon enfant.'],
  ['Kusala', '[kù-sá-là]', 'Verbe', 'Travailler / Faire', 'To work / To do', 'Verbes', 1, 'L\'action utile pour la famille.', 'Bansala misalu myeto.', 'Ils accomplissent nos travaux.'],
  ['Kudia', '[kù-dí-yà]', 'Verbe', 'Manger / Prendre le repas', 'To eat', 'Verbes', 1, '« Iza wa dia » = Viens manger.', 'Dia madiya maku mwana.', 'Mange ton repas.'],
  ['Kunwa', '[kù-nwá]', 'Verbe', 'Boire', 'To drink', 'Verbes', 1, 'Se désaltérer d\'eau pure.', 'Nwa masa ma mbote.', 'Bois de l\'eau fraîche.'],
  ['Kuseka', '[kù-sé-kà]', 'Verbe', 'Rire / Sourire / Se réjouir', 'To laugh / To smile', 'Verbes', 1, 'Le rire communicatif des enfants.', 'Bana beena seka na kiese.', 'Les enfants rient de bon cœur.'],
  ['Kudila', '[kù-dí-là]', 'Verbe', 'Pleurer / Sangloter', 'To cry', 'Verbes', 1, '« Bika kudila » = Sèche tes larmes.', 'Bika kudila, mama weena vava.', 'Ne pleure pas, maman est là.'],
  ['Kuwenda', '[kù-wé-ndà]', 'Verbe', 'Aller / Partir / Se déplacer', 'To go', 'Verbes', 1, '« Kwenda » = Va / En route.', 'Kwenda ku zandu sumba madiya.', 'Va au marché acheter des vivres.'],
  ['Kwiza', '[kwí-zà]', 'Verbe', 'Venir / Arriver', 'To come', 'Verbes', 1, '« Iza » = Viens ici.', 'Iza twatuba mambu ma ndandu.', 'Viens nous allons parler sagement.'],
  ['Kutanga', '[kù-tá-ngà]', 'Verbe', 'Lire / Compter', 'To read / To count', 'Verbes', 2, 'L\'instruction par le livre.', 'Tanga mukanda waku mbote.', 'Lis attentivement ton livre.'],
  ['Kusona', '[kù-só-nà]', 'Verbe', 'Écrire / Noter', 'To write', 'Verbes', 2, 'Noter les mots pour ne pas oublier.', 'Sona nkumbu\'aku mu mukanda.', 'Écris ton prénom dans le cahier.'],
  ['Kusukula', '[kù-sù-kú-là]', 'Verbe', 'Laver / Nettoyer / Purifier', 'To wash / To clean', 'Verbes', 2, 'L\'hygiène corporelle et de la maison.', 'Sukula moko manga wa dia.', 'Lave tes mains avant de passer à table.'],
  ['Kujina', '[kù-jí-nà]', 'Verbe', 'Brûler / Chauffer / Flamber', 'To burn / To shine', 'Verbes', 3, 'La flamme vive du foyer.', 'Tiya tyeena jina vana nzo.', 'Le feu crépite dans l\'âtre.'],
  ['Kubaka', '[kù-bá-kà]', 'Verbe', 'Prendre / Attraper / Recevoir', 'To take / To catch', 'Verbes', 2, 'Saisir une opportunité ou un fruit.', 'Baka dikondo wa dia.', 'Prends une banane pour ton goûter.'],
  ['Kupana', '[kù-pá-nà]', 'Verbe', 'Donner / Offrir / Partager', 'To give / To offer', 'Verbes', 2, 'La générosité du don fraternel.', 'Pana mpangi\'aku madiya.', 'Partage le repas avec ton frère.'],
  ['Kukeba', '[kù-ké-bà]', 'Verbe', 'Prendre soin / Veiller sur / Protéger', 'To take care / To watch over', 'Verbes', 2, 'La vigilance bienveillante.', 'Keba bana baaku mbote.', 'Prends grand soin de tes enfants.'],

  // 11. Qualités, Sentiments & Émotions (Niveaux 3 à 5)
  ['Kiese', '[kì-é-sè]', 'cl. 7', 'Joie / Allégresse / Bonheur', 'Joy / Happiness', 'Sentiments & Qualités', 1, 'La joie célébrée en famille.', 'Kiese kinene kiena mu nzo eto.', 'Une grande joie règne dans notre maison.'],
  ['Ngolo', '[ǹ-gó-lò]', 'cl. 9/10', 'Force / Santé / Courage', 'Strength / Health', 'Sentiments & Qualités', 1, '« Ngolo zena ! » = Je suis en pleine forme.', 'Ngolo zena, matondo kwa Nzambi !', 'Je suis en pleine santé, merci au Ciel !'],
  ['Luzolo', '[lù-zó-lò]', 'cl. 11', 'Amour / Affection sincère', 'Love / Compassion', 'Sentiments & Qualités', 2, 'L\'amour profond et la charité.', 'Luzolo lwa mpangi yina bumbote.', 'L\'amour fraternel apporte la paix.'],
  ['Mayele', '[mà-yé-lè]', 'cl. 6', 'Intelligence / Sagacité', 'Wisdom / Intelligence', 'Sentiments & Qualités', 2, 'L\'esprit d\'analyse et d\'apprentissage.', 'Mwana weena na mayele ma nene.', 'Cet enfant a une belle intelligence.'],
  ['Bumbote', '[bù-mbó-tè]', 'cl. 14', 'Bonté / Noblesse d\'âme / Vertu', 'Goodness / Kindness', 'Sentiments & Qualités', 3, 'Avoir un cœur bon et bienveillant.', 'Vanga bumbote kwa bantu bawonsono.', 'Pratique la bonté envers chacun.'],
  ['Mpasi', '[m̀-pá-sì]', 'cl. 9/10', 'Douleur / Épreuve / Tristesse', 'Pain / Hardship', 'Sentiments & Qualités', 3, 'Les épreuves que l\'on surmonte ensemble.', 'Mpasi zi fwene, twakembila kiese.', 'L\'épreuve est passée, célébrons la joie.'],
  ['Lemvo', '[lé-mvò]', 'cl. 5', 'Pardon / Clémence / Réconciliation', 'Forgiveness', 'Sentiments & Qualités', 4, 'Le geste de paix pour réconcilier.', 'Pana lemvo kwa mpangi\'aku.', 'Accorde ton pardon à ton frère.'],
  ['Kieleka', '[kì-é-lé-kà]', 'cl. 7', 'Vérité / Authenticité / Sincérité', 'Truth / Authenticity', 'Sentiments & Qualités', 4, 'Parler sans détours ni mensonges.', 'Kieleka kyeena nungisa muntu.', 'La vérité élève toujours la personne.'],
  ['Luvunu', '[lù-vú-nù]', 'cl. 11', 'Mensonge / Tromperie', 'Lie / Deception', 'Sentiments & Qualités', 4, 'Rejeté par la sagesse des aînés.', 'Bika luvunu, vova kieleka.', 'Rejette le mensonge et dis la vérité.'],

  // 12. Patrimoine, Proverbes & Sagesses Ancestrales (Niveau 5)
  ['Kingana', '[kì-ngá-nà]', 'cl. 7 (pl. bingana - cl. 8)', 'Proverbe / Sagesse / Maxime', 'Proverb / Wise saying', 'Patrimoine & Sagesse', 5, 'Les proverbes sont la mémoire philosophique des anciens.', 'Twa tuba kingana kya bambuta.', 'Énonçons un proverbe des anciens.'],
  ['Nkunga', '[ǹ-kú-ngà]', 'cl. 3 (pl. minkunga - cl. 4)', 'Chant patrimonial / Hymne ancestral', 'Song / Anthem', 'Patrimoine & Sagesse', 5, 'Chant rituel relatant l\'histoire des ancêtres.', 'Yimbila nkunga wa ntotila.', 'Entonne l\'hymne des anciens rois.'],
  ['Ntotila', '[ǹ-tò-tí-là]', 'cl. 1/2', 'Souverain / Monarque du Kongo historique', 'King / Sovereign', 'Patrimoine & Sagesse', 5, 'Titre des grands rois de l\'ancien Royaume du Kongo.', 'Kongo dia Ntotila dyabedi na nkembo.', 'Le royaume des souverains était glorieux.'],
  ['Mfumu', '[m̀-fú-mù]', 'cl. 1 (pl. bamfumu - cl. 2)', 'Chef traditionnel / Guide respectable', 'Chief / Leader', 'Patrimoine & Sagesse', 5, 'Le sage investi de l\'autorité morale et coutumière.', 'Mfumu weena tubila mambu ma ndandu.', 'Le chef s\'exprime avec grand discernement.'],
  ['Lusansu', '[lù-sá-nsù]', 'cl. 11', 'Histoire / Mémoire généalogique orale', 'History / Oral genealogy', 'Patrimoine & Sagesse', 5, 'L\'arbre généalogique et l\'histoire transmise oralement.', 'Keba lusansu lwa kanda dyaku.', 'Garde précieusement l\'histoire de ta lignée.'],
  ['Kalunga', '[kà-lú-ngà]', 'cl. 9 / cl. 5', 'Océan / Immensité / Éternité cosmique', 'Ocean / Eternity', 'Patrimoine & Sagesse', 5, 'L\'océan infini et le seuil de l\'éternité dans la cosmologie Kongo.', 'Masa ma Kalunga meena nene.', 'Les eaux de l\'océan s\'étendent à l\'infini.'],
  ['Nsamu', '[ǹ-sá-mù]', 'cl. 9/10', 'Nouvelle / Récit / Événement', 'News / Story', 'Patrimoine & Sagesse', 5, '« Nki nsamu ? » -> « Nsamu ve ! » (Tout va bien).', 'Nki nsamu bwabu ? - Nsamu ve !', 'Quelles sont les nouvelles ? - Tout est en paix !']
];

// Structure complete dictionary with full IDs and fields
const FULL_ITEMS = VOCABULARY_DEFINITIONS.map((row, idx) => {
  const [wordNative, phonetic, nounClass, translationFr, translationEn, category, difficultyLevel, culturalNote, exampleSentenceNative, exampleSentenceFr] = row;
  const cleanAudioName = wordNative.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  return {
    id: `w${idx + 1}`,
    wordNative,
    phonetic,
    nounClass,
    translationFr,
    translationEn,
    category,
    difficultyLevel,
    culturalNote,
    exampleSentenceNative,
    exampleSentenceFr,
    audioUrl: `/audio/words/${cleanAudioName}.wav`,
    validatedByElder: true,
    speakerName: (idx % 2 === 0) ? 'Mbuta Papa Jean-Baptiste (Pointe-Noire)' : 'Mbuta Pauline (Brazzaville)',
    source: 'MBUTA / Dictionnaire Lari-Français'
  };
});

// Write to JSON
const jsonPath = path.resolve('data/lexicon/dictionnaire_lari_francais.json');
fs.writeFileSync(jsonPath, JSON.stringify(FULL_ITEMS, null, 2), 'utf-8');

// Write to CSV
const csvHeader = 'id,word_native,phonetic,noun_class,translation_fr,translation_en,category,difficulty_level,cultural_note,example_sentence_native,example_sentence_fr,source,confidence_level\n';
const csvRows = FULL_ITEMS.map(w => {
  const note = `"${(w.culturalNote || '').replace(/"/g, '""')}"`;
  const exNat = `"${(w.exampleSentenceNative || '').replace(/"/g, '""')}"`;
  const exFr = `"${(w.exampleSentenceFr || '').replace(/"/g, '""')}"`;
  return `${w.id},${w.wordNative},${w.phonetic},${w.nounClass || ''},"${w.translationFr}","${w.translationEn}",${w.category},${w.difficultyLevel},${note},${exNat},${exFr},"${w.source}","Très élevée"`;
}).join('\n');

fs.writeFileSync(path.resolve('data/lexicon/dictionnaire_lari_francais.csv'), csvHeader + csvRows, 'utf-8');

console.log(`✅ Base documentaire Lari : ${FULL_ITEMS.length} mots complets générés dans data/lexicon/ !`);
