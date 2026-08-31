/**
 * Historical background for each book of the Bible and for each era of the
 * chronological reading.
 *
 * This is background, not commentary: who wrote, when, to whom, and what was
 * happening in the world that the first hearers already knew and we do not.
 * Where authorship or date is genuinely disputed among scholars, the `note`
 * field says so and gives the main positions rather than settling the question.
 * Dates before the exile are approximate; anything earlier than the divided
 * kingdom is approximate to within a century or more.
 */

export interface BookContext {
  /** 1-66, standard Protestant canon order (Genesis = 1, Revelation = 66). */
  book: number
  author: string
  written: string
  audience: string
  /** The political and religious situation the book comes out of. */
  setting: string
  purpose: string
  themes: string[]
  /** Present only where authorship or date is genuinely contested. */
  note?: string
}

export interface EraContext {
  /** Matches an id in ERAS (src/data/chronology.ts). */
  era: string
  background: string
  world: string
}

export const BOOK_CONTEXT: BookContext[] = [
  {
    book: 1,
    author: "Traditionally Moses",
    written: "Traditionally c. 1400 BC; many scholars place the written form between the tenth and fifth centuries BC",
    audience: "Israel, as a people being formed out of slavery and given a land",
    setting:
      "Genesis reaches back before Israel existed and ends with Jacob's family living as guests in Egypt. Its middle chapters move through a world of city-states, tribal migration and household religion in Mesopotamia and Canaan in the early second millennium BC, where a man's security lay in land, offspring and the favour of local gods. The customs the story assumes — adopting an heir, a barren wife giving her servant to her husband, a birthright sold, a covenant cut by walking between severed animals — were ordinary legal practice in that world and needed no explanation. Against that background the claim that one God made everything, called one childless couple, and bound himself to them by oath is the book's central provocation.",
    purpose:
      "To trace the world from creation to the family of Israel, and to ground Israel's existence in God's promise to Abraham rather than in its own strength.",
    themes: ["creation and order", "the fall and its spread", "covenant promise", "election of a family", "blessing to the nations", "providence over human evil"],
    note: "Mosaic authorship of the Pentateuch is traditional and is affirmed by much of the New Testament and Jewish tradition. Since the nineteenth century many scholars have instead seen Genesis as a compilation of older sources edited over centuries. The text itself names no author."
  },
  {
    book: 2,
    author: "Traditionally Moses",
    written: "Traditionally c. 1400 BC; date of composition disputed",
    audience: "Israel in the wilderness and afterwards",
    setting:
      "Egypt in the late Bronze Age was the strongest state in the region, its wealth built on the Nile and on forced labour, its Pharaoh regarded as divine and its gods identified with the sun, the river and the fertility of the land. The plagues strike precisely at those gods. Israel's ancestors have become a slave caste in the Delta, valuable enough to be kept and numerous enough to be feared. Two dates are argued for the exodus: an early one around 1446 BC, under Amenhotep II, and a later one in the thirteenth century under Rameses II. Sinai, where the book ends, was the wilderness south of Canaan and outside any empire's control.",
    purpose:
      "To record how God rescued Israel from Egypt, bound them to himself by covenant at Sinai, and came to dwell among them.",
    themes: ["deliverance from slavery", "the name and character of God", "covenant law", "the presence of God", "idolatry and mediation"]
  },
  {
    book: 3,
    author: "Traditionally Moses",
    written: "Traditionally c. 1400 BC; priestly material often dated later",
    audience: "Israel, and especially the priests of Aaron's line",
    setting:
      "Israel is camped at Sinai with a newly built tabernacle in the middle of the camp and no idea how to live near a holy God without being destroyed. Sacrifice, purity rules and food laws were not unusual in the ancient Near East — Egypt, Babylon and Canaan all had elaborate priesthoods and offering systems — but Israel's differ sharply in what they exclude: no images, no divination, no fertility rites, no child sacrifice, no cult of the dead. The book assumes a reader who already knows what a burnt offering looks like and needs to be told what it means.",
    purpose:
      "To set out how a holy God may be approached and how a people set apart is to live.",
    themes: ["holiness", "sacrifice and atonement", "clean and unclean", "priesthood", "the sabbath and the feasts"]
  },
  {
    book: 4,
    author: "Traditionally Moses",
    written: "Traditionally c. 1400 BC; date of composition disputed",
    audience: "Israel, and particularly the generation about to enter Canaan",
    setting:
      "The book covers about forty years, from the departure from Sinai to the plains of Moab across the Jordan from Jericho. Its hinge is the report of the twelve spies and the refusal to enter the land, after which an entire generation dies in the wilderness. The territory east of the Jordan was contested among Moab, Ammon, Edom and the Amorite kingdoms of Sihon and Og, all of which appear here as real political actors. Israel travels as an armed camp arranged by tribe, dependent on water sources and on the goodwill or hostility of the peoples whose land it skirts.",
    purpose:
      "To record the wilderness years and to show why one generation failed to enter the land while the next was prepared to.",
    themes: ["wandering and testing", "rebellion and judgement", "the census and the tribes", "leadership under strain", "God's promise outlasting failure"]
  },
  {
    book: 5,
    author: "Traditionally Moses",
    written: "Traditionally c. 1400 BC; commonly linked by critical scholars to the law book found in 622 BC (2 Kgs 22)",
    audience: "The generation of Israelites standing on the edge of Canaan",
    setting:
      "Israel is encamped on the plains of Moab, Moses is about to die, and the people are one river away from a land they have never lived in. The book is cast as a series of farewell addresses. Its structure follows the shape of ancient Near Eastern treaties between a great king and a subject people — historical preamble, stipulations, witnesses, blessings and curses — a form Israel's neighbours would have recognised immediately. It looks ahead to settled agricultural life, to the temptations of Canaanite religion, and to the possibility of a king and eventual exile.",
    purpose:
      "To renew the covenant with a new generation and to press on them the choice between loyalty to God and destruction.",
    themes: ["covenant renewal", "love and obedience", "one God, one place of worship", "blessing and curse", "remembering"],
    note: "Deuteronomy presents itself as the words of Moses. Many critical scholars associate its written form with the reform of Josiah in 622 BC, when a book of the law was found in the temple; others hold to substantially Mosaic composition."
  },
  {
    book: 6,
    author: "Anonymous; tradition names Joshua for much of it",
    written: "Events c. 1400 or c. 1250 BC; written form probably much later",
    audience: "Israel living in the land, looking back on how it was taken",
    setting:
      "Canaan in the late Bronze Age was not a single kingdom but a patchwork of walled city-states — Jericho, Ai, Hazor, Gezer, Lachish — nominally under Egyptian oversight that was weakening. Each had its own king, its own gods and its own small territory. Israel enters as a tribal confederation with no cavalry, no siege equipment and no capital, and the book presents its victories as God's doing rather than military superiority. The second half is a land distribution document, dividing territory by tribe and lot.",
    purpose:
      "To record the entry into the land promised to Abraham and the allotment of it among the tribes.",
    themes: ["promise fulfilled", "holy war", "the land as inheritance", "covenant loyalty", "the danger of half-obedience"]
  },
  {
    book: 7,
    author: "Anonymous; Jewish tradition suggests Samuel",
    written: "Events c. 1350-1050 BC; written later, from a monarchic standpoint",
    audience: "Israelites under the monarchy, reading about the era before it",
    setting:
      "Between the conquest and the first king, Israel had no central government, no standing army and no capital. Tribes acted alone or in shifting alliances, and leadership was ad hoc: a judge rose in a crisis, delivered one region, and the arrangement lapsed. The pressures came from Moab, Midian, Ammon, the Canaanite cities of the north, and above all from the Philistines, who had settled the coastal plain and held an advantage in iron. Religiously the period is one of steady absorption into Canaanite practice, with Baal and Asherah worshipped alongside or instead of the Lord. The refrain that everyone did what was right in his own eyes is the book's own verdict.",
    purpose:
      "To show the cycle of apostasy, oppression, outcry and deliverance in the years before the monarchy, and the disorder that came of having no king.",
    themes: ["cycles of apostasy and rescue", "unlikely deliverers", "moral collapse", "tribal disunity", "the need for a king"]
  },
  {
    book: 8,
    author: "Anonymous",
    written: "Events in the period of the judges; written after David's rise, tenth century BC or later",
    audience: "Israelites under the monarchy",
    setting:
      "A famine drives a family from Bethlehem into Moab, a neighbouring people with a long history of hostility toward Israel and whose men were barred from the assembly. The story turns on ordinary agrarian law: gleaning rights for the poor, the duty of a near kinsman to redeem land, and levirate marriage to raise up an heir for a dead man. Naomi returns destitute, and in that society a widow without sons had no standing at all. That the book ends with a Moabite woman as David's great-grandmother is the point.",
    purpose:
      "To tell how covenant loyalty in an ordinary household preserved a family line that led to David.",
    themes: ["loyal love", "redemption of land and family", "the outsider included", "providence in ordinary life"]
  },
  {
    book: 9,
    author: "Anonymous; compiled from earlier sources",
    written: "Events c. 1100-1010 BC; compiled later, probably during or after the exile",
    audience: "Israel, reflecting on the origins of the monarchy",
    setting:
      "First and Second Samuel were one book in the Hebrew Bible. It opens with Israel losing to the Philistines badly enough that the ark itself is captured, and the sanctuary at Shiloh is destroyed. The demand for a king is explicitly a demand to be like the surrounding nations, and the book is candid about what that cost. Saul's reign is a series of campaigns against the Philistines and Amalekites conducted by a man whose authority is never secure; David appears first as a court musician, then as a fugitive commanding a private force, then as a vassal of a Philistine city.",
    purpose:
      "To record the transition from judges to monarchy and the rise of David under prophetic oversight.",
    themes: ["the rise and failure of Saul", "kingship under God", "anointing and the Spirit", "prophetic authority", "waiting for the promise"]
  },
  {
    book: 10,
    author: "Anonymous; compiled from earlier sources",
    written: "Events c. 1010-970 BC; compiled later",
    audience: "Israel under the monarchy and after it",
    setting:
      "David unites the tribes, takes Jerusalem from the Jebusites and makes it a capital belonging to no tribe, moves the ark there, and builds an empire over Moab, Ammon, Edom, Aram and the Philistines while Egypt and Assyria are both weak. The covenant of 2 Samuel 7, promising David a lasting dynasty, becomes the root of Israel's later hope for a messiah. The second half of the book is unsparing: adultery, a murder arranged by letter, a raped daughter, a son's rebellion and a civil war, all presented as consequences.",
    purpose:
      "To record David's reign, the covenant made with his house, and the damage his sin did to it.",
    themes: ["the Davidic covenant", "Jerusalem and the ark", "sin and consequence", "repentance", "kingship as service"]
  },
  {
    book: 11,
    author: "Anonymous; tradition suggests Jeremiah or a prophetic circle",
    written: "Final form during the exile, c. 560-550 BC",
    audience: "Judeans in exile asking how they came to lose everything",
    setting:
      "Kings covers roughly four hundred years, from Solomon's accession to the release of Jehoiachin from a Babylonian prison. First Kings opens with a court succession struggle, moves through the building of the temple and the wealth of Solomon's reign, and then the split of the kingdom in 931 BC after Rehoboam refuses to lighten the forced labour. From then on there are two states: Israel in the north with its rival sanctuaries at Bethel and Dan, and Judah in the south with the temple. The book judges every king by one standard — loyalty to the Lord and to Jerusalem — and introduces Elijah in a north ruled by Ahab and Jezebel, who were promoting Baal as state religion.",
    purpose:
      "To explain, from a prophetic standpoint, why the kingdoms fell.",
    themes: ["the temple", "the divided kingdom", "prophets against kings", "idolatry", "the word of God as the engine of history"]
  },
  {
    book: 12,
    author: "Anonymous; same compiler as 1 Kings",
    written: "Final form during the exile, c. 560-550 BC",
    audience: "Judeans in exile",
    setting:
      "The book runs from Elisha to the fall of both kingdoms. Assyria dominates the ninth and eighth centuries, extracting tribute and finally destroying Samaria in 722 BC and deporting the northern tribes. Judah survives, in part by paying, and Hezekiah lives through Sennacherib's invasion of 701 BC. Manasseh's long reign reintroduces every practice the reformers had removed; Josiah's reform of 622 BC reverses it briefly. Then Assyria collapses, Babylon takes its place at Carchemish in 605 BC, and Jerusalem is besieged and destroyed in 587/586 BC, the temple burned and the population deported.",
    purpose:
      "To record the end of both kingdoms and to show that the disaster was covenant judgement, not the weakness of Israel's God.",
    themes: ["Assyria and Babylon", "reform and relapse", "the fall of Samaria and Jerusalem", "prophecy fulfilled", "a flicker of hope at the end"]
  },
  {
    book: 13,
    author: "Anonymous; traditionally Ezra or a Levitical chronicler",
    written: "c. 400-350 BC",
    audience: "The restored community in Judah under Persian rule",
    setting:
      "Chronicles was written for people who had come back from exile to a small province called Yehud, with a modest temple, no king, and a Persian governor. Its long opening genealogies establish who belongs to Israel and who serves in the temple — a live question when families had to prove their descent. The narrative then retells the history already told in Samuel and Kings, but selectively: the northern kingdom is largely passed over, David's adultery and Absalom's revolt are omitted, and the emphasis falls on worship, the ark, the Levites and the temple.",
    purpose:
      "To reassure a small, kingless community that they are the true continuation of Israel, and to centre their life on temple worship.",
    themes: ["genealogy and continuity", "David as worship-founder", "the temple and the Levites", "the covenant with David"],
    note: "The author is unnamed. Jewish tradition credits Ezra; many scholars posit an anonymous chronicler, and opinion divides over whether Chronicles and Ezra-Nehemiah come from the same hand."
  },
  {
    book: 14,
    author: "Anonymous; same compiler as 1 Chronicles",
    written: "c. 400-350 BC",
    audience: "The restored community in Judah under Persian rule",
    setting:
      "The second half runs from Solomon's temple to Cyrus's decree permitting return. It follows the kings of Judah alone and gives unusual space to the reforming kings — Asa, Jehoshaphat, Hezekiah, Josiah — and to national assemblies, Passover celebrations and the cleansing of the temple. Readers who had just rebuilt an altar on a ruined site were meant to see themselves in those scenes. It ends mid-sentence with permission to go up to Jerusalem.",
    purpose:
      "To trace the history of Judah and its temple in a way that shapes the post-exilic community's worship and hope.",
    themes: ["temple worship restored", "reforming kings", "prayer and repentance", "seeking God", "return"]
  },
  {
    book: 15,
    author: "Anonymous; incorporates first-person memoirs of Ezra",
    written: "c. 440-400 BC or somewhat later",
    audience: "Jews resettling in the Persian province of Yehud",
    setting:
      "Cyrus of Persia took Babylon in 539 BC and reversed its deportation policy, allowing subject peoples to return home and rebuild their sanctuaries; the Jews were one such group. The rebuilt temple, finished in 516 BC, was small enough that men who remembered Solomon's wept. Ezra himself, a priest and scribe, arrives later under Artaxerxes with a royal commission to teach and enforce the law of God as the law of the king. The crisis at the end of the book — intermarriage with surrounding peoples — was about whether a tiny community with no political power could survive as a distinct people at all.",
    purpose:
      "To record the return from exile, the rebuilding of the temple, and the re-establishment of the law at the centre of Jewish life.",
    themes: ["return and rebuilding", "the second temple", "Persian patronage", "the law re-established", "separation and identity"]
  },
  {
    book: 16,
    author: "Anonymous compiler using Nehemiah's first-person memoir",
    written: "c. 430-400 BC",
    audience: "The Jewish community in and around Jerusalem",
    setting:
      "Nehemiah was cupbearer to Artaxerxes I, a position of trust at the Persian court, and arrived in Jerusalem around 445 BC as governor. The city had been without walls for well over a century, which meant no defence, no status, and no way to stop the surrounding provinces from treating it as open country. Sanballat of Samaria, Tobiah the Ammonite and Geshem the Arab opposed the work because a walled Jerusalem shifted the balance of power in the region. Inside the city the problems were economic: Jewish creditors were foreclosing on Jewish debtors and taking their children as slaves.",
    purpose:
      "To record the rebuilding of Jerusalem's wall and the reform of the community's common life under the law.",
    themes: ["rebuilding under opposition", "prayer and planning", "covenant renewal", "social justice among the poor", "leadership"]
  },
  {
    book: 17,
    author: "Anonymous",
    written: "Probably fourth to third century BC; events set c. 483-473 BC",
    audience: "Jews living outside the land, under Gentile rule",
    setting:
      "The story is set in Susa, one of the Persian capitals, in the reign of Xerxes I, and concerns Jews who did not return after the exile but stayed in the empire — the majority of them. It assumes a world of harems, court intrigue, irrevocable royal edicts and officials whose favour could be bought, in which a scattered minority had no legal protection beyond the goodwill of whoever held office. God is never named in the book, and no one prays aloud in it.",
    purpose:
      "To account for the feast of Purim and to show a threatened minority preserved.",
    themes: ["hidden providence", "diaspora life", "courage and timing", "reversal of fortunes", "the origin of Purim"]
  },
  {
    book: 18,
    author: "Anonymous",
    written: "Uncertain; the setting is patriarchal, the composition variously dated from the tenth to the fourth century BC",
    audience: "Israelites wrestling with undeserved suffering",
    setting:
      "Job lives in Uz, outside Israel, with no priest, no temple, no law of Moses and no covenant history in view. His wealth is counted in livestock and he offers sacrifices himself as head of a household, which is why the setting is usually read as patriarchal. The conversation runs on an assumption shared across the ancient Near East and stated plainly by his friends: the gods reward the righteous and punish the wicked, so a ruined man must have earned it. The book takes that assumption apart without replacing it with an explanation.",
    purpose:
      "To confront the suffering of a righteous man and to refuse the easy account of why it happens.",
    themes: ["innocent suffering", "the limits of retribution theology", "the friends' failed comfort", "the speech from the whirlwind", "the creator's freedom"],
    note: "Both the date and the genre of Job are disputed: some read it as an account of a historical figure, others as a wisdom drama built around one. The prose frame and the poetic dialogues are sometimes assigned to different hands, and the Elihu speeches are often argued to be a later addition."
  },
  {
    book: 19,
    author: "Multiple; David is named in about half, with Asaph, the sons of Korah, Solomon, Moses, Heman and Ethan named for others",
    written: "Individual psalms from c. 1000 BC to the post-exilic period; collected into five books by roughly the third century BC",
    audience: "Israel at worship, and individuals in private prayer",
    setting:
      "The Psalms span nearly the whole history of Israel. Some belong to the royal court and assume a king on the throne in Jerusalem; some are pilgrimage songs sung on the road up to the temple at festival time; some come out of the exile, when the songs of Zion had to be sung in a foreign land; some are the prayers of individuals under illness, false accusation or pursuit. The headings preserve musical directions and occasions whose exact meaning is now lost. The collection was Israel's hymnbook and prayer book, and the psalms of lament outnumber the psalms of praise.",
    purpose:
      "To give Israel words for praise, complaint, confession and thanksgiving before God.",
    themes: ["lament and praise", "kingship, human and divine", "Zion and the temple", "trust in distress", "the law as delight", "God's justice questioned"]
  },
  {
    book: 20,
    author: "Solomon, with named collections by 'the men of Hezekiah', Agur and Lemuel",
    written: "Material from the tenth century BC onward; collected by the time of Hezekiah (late eighth century) and after",
    audience: "Young men being trained for responsibility, and Israel generally",
    setting:
      "Wisdom literature was an international genre; Egypt produced instruction texts centuries before Solomon, and the Instruction of Amenemope has close parallels with one section of Proverbs. Such collections were used in training officials and sons of the governing class in prudence, self-control, speech, money and sexual restraint. Proverbs sets that shared craft of living inside the fear of the Lord. Its sayings are general truths about how life usually goes, not promises — a distinction Job and Ecclesiastes press hard.",
    purpose:
      "To teach skill in living, ordered by reverence for God.",
    themes: ["the fear of the Lord", "wisdom and folly personified", "speech and self-control", "work, money and justice", "family instruction"]
  },
  {
    book: 21,
    author: "'The Preacher, son of David'; traditionally Solomon",
    written: "Traditionally tenth century BC; the language suggests to many a much later, post-exilic date",
    audience: "Thoughtful Israelites confronting the limits of wisdom and wealth",
    setting:
      "The book speaks from a position of means and leisure — building projects, gardens, servants, music, the freedom to try everything and record the result. Its world is one where death cancels every advantage, where the courts are corrupt and the poor have no redress, and where the older confidence that wisdom secures a good outcome no longer holds. Its repeated word, hevel, means vapour or breath: not that life is worthless but that it cannot be grasped or kept.",
    purpose:
      "To test what human effort can secure under the sun, and to counsel a life received as a gift rather than mastered.",
    themes: ["vanity and vapour", "the limits of wisdom", "death levelling all", "enjoying ordinary gifts", "fearing God amid uncertainty"],
    note: "The narrator identifies himself as son of David, king in Jerusalem, and tradition takes this as Solomon. Many scholars regard the Hebrew, which contains Aramaic and possibly Persian-influenced forms, as considerably later than the tenth century and read the royal voice as a literary persona."
  },
  {
    book: 22,
    author: "Solomon, by the superscription",
    written: "Traditionally tenth century BC; date disputed",
    audience: "Israel; used at Passover in later Jewish practice",
    setting:
      "A cycle of love poems between a woman and a man, with a chorus of onlookers. Comparable love poetry survives from Egypt from centuries earlier, and the imagery — flocks, spices, vineyards, city watchmen, a locked garden — belongs to that world. In a canon otherwise concerned with law, kings and prophecy, the book contains no explicit theology; the woman speaks most of the lines, and desire is treated as good.",
    purpose:
      "To celebrate love and desire between a man and a woman.",
    themes: ["desire and delight", "mutual belonging", "longing and absence", "the goodness of the body"],
    note: "Both the authorship and the mode of reading are debated: Jewish and Christian tradition long read the book allegorically, of God and Israel or Christ and the church, while most modern interpreters read it first as human love poetry. Attribution to Solomon may mean 'by', 'for', or 'in the manner of' him."
  },
  {
    book: 23,
    author: "Isaiah son of Amoz; chapters 40-66 attributed by many scholars to later hands",
    written: "Ministry c. 740-690 BC; final form later",
    audience: "Judah and Jerusalem under Assyrian threat, and later exiles",
    setting:
      "Isaiah is called in the year King Uzziah died, around 740 BC, and serves through the reigns of Jotham, Ahaz and Hezekiah. Assyria under Tiglath-pileser III is expanding westward, absorbing states one by one. In 735 BC Syria and the northern kingdom try to force Judah into an anti-Assyrian coalition; Ahaz instead appeals to Assyria for protection and becomes its vassal. Samaria falls in 722 BC. In 701 BC Sennacherib devastates Judah and besieges Jerusalem, which survives. The later chapters address a different situation entirely: Jerusalem already destroyed, the people in Babylon, and Cyrus of Persia named as the one who will send them home.",
    purpose:
      "To call Judah to trust God rather than foreign powers, to announce judgement, and to promise a restored people and a servant who suffers for them.",
    themes: ["the Holy One of Israel", "trust versus political alliance", "judgement and remnant", "the servant of the Lord", "comfort and new creation", "the nations brought in"],
    note: "The unity of Isaiah is one of the most-debated questions in Old Testament scholarship. Traditionally the whole book is the work of the eighth-century prophet, its later chapters predictive. Many scholars hold that chapters 40-55 come from an anonymous prophet during the Babylonian exile and 56-66 from after the return, largely because those chapters address exiles as their contemporaries and name Cyrus."
  },
  {
    book: 24,
    author: "Jeremiah, with Baruch as scribe",
    written: "Ministry c. 627-580 BC",
    audience: "Judah in its last decades, and the exiles",
    setting:
      "Jeremiah begins prophesying in the thirteenth year of Josiah and continues through the reforms, Josiah's death at Megiddo in 609 BC, and the reigns of the weak kings who followed. Babylon defeats Egypt at Carchemish in 605 BC and becomes the regional power; Judah's kings gamble repeatedly on Egyptian help. Jerusalem is taken in 597 BC with the first deportation, and destroyed in 587/586 BC. Jeremiah spends those decades telling the city to submit to Babylon, which made him look like a traitor: he is beaten, put in stocks, thrown into a cistern and finally carried off to Egypt against his will by the survivors.",
    purpose:
      "To warn Judah that judgement was certain, to interpret the catastrophe when it came, and to promise a new covenant beyond it.",
    themes: ["a prophet under persecution", "false prophets and false security", "the temple as no guarantee", "submission to Babylon", "the new covenant", "seventy years"]
  },
  {
    book: 25,
    author: "Anonymous; traditionally Jeremiah",
    written: "Shortly after 586 BC",
    audience: "Survivors of the fall of Jerusalem",
    setting:
      "Five poems written in the ruins of Jerusalem after the Babylonian destruction. The city walls are broken, the temple burned, the king blinded and deported, and the population reduced by famine, sword and deportation; the poems describe siege starvation without euphemism. Four of the five are acrostics, working through the Hebrew alphabet — grief given a strict form. The book was read publicly on the anniversary of the temple's destruction.",
    purpose:
      "To mourn the destruction of Jerusalem and to hold both God's justice and the people's anguish in the same voice.",
    themes: ["grief given form", "the city as a widow", "God's justice acknowledged", "mercies new every morning", "unanswered ending"],
    note: "Traditionally ascribed to Jeremiah, but the book names no author and most scholars leave it anonymous."
  },
  {
    book: 26,
    author: "Ezekiel son of Buzi, a priest",
    written: "Dated oracles between 593 and 571 BC",
    audience: "Judean exiles in Babylonia",
    setting:
      "Ezekiel was deported in 597 BC with King Jehoiachin and the first group of exiles, and lived among them at Tel Abib by the Chebar canal, an irrigation channel in southern Mesopotamia. He was a priest with no temple to serve in. For the first years his message is that Jerusalem will fall, against a confident expectation among the exiles that they would soon go home; his sign-acts are extreme — lying on his side for months, shaving his head, refusing to mourn his wife's death. After news arrives in 586 BC that the city has fallen, his message changes entirely into restoration, culminating in a vision of a new temple.",
    purpose:
      "To convince the exiles that Jerusalem's fall was deserved, and then to promise a restored people, a new heart and God's return to dwell among them.",
    themes: ["the glory of God departing and returning", "individual responsibility", "sign-acts", "dry bones and new heart", "the shepherds of Israel", "a new temple"]
  },
  {
    book: 27,
    author: "Daniel; date of composition disputed",
    written: "Traditionally sixth century BC; many scholars date the final form to c. 165 BC",
    audience: "Jews living under foreign rule",
    setting:
      "The narrative chapters are set in the Babylonian court from the deportation of 605 BC through the reign of Nebuchadnezzar, the fall of Babylon to Cyrus in 539 BC, and into Persian service. They concern young Judeans trained for imperial administration who must decide how far they can serve a pagan state without worshipping it: diet, prayer and the refusal to bow before an image. Half the book is written in Aramaic, the administrative language of the empire. The visions of the second half sweep through a succession of empires and dwell in detail on a persecuting king who stops the temple sacrifices.",
    purpose:
      "To show God's sovereignty over empires and to sustain faithfulness under rulers who demand worship.",
    themes: ["faithfulness under pagan rule", "God rules over kings", "dreams and their interpretation", "successive empires", "resurrection and vindication", "the son of man"],
    note: "Date is sharply contested. The traditional view takes the book as sixth-century, its later visions predictive. Many scholars date the final form to the persecution under Antiochus IV Epiphanes around 167-164 BC, chiefly because the detail of chapter 11 tracks that period closely and then diverges. The two positions imply different readings of almost every vision."
  },
  {
    book: 28,
    author: "Hosea son of Beeri",
    written: "Ministry c. 755-715 BC",
    audience: "The northern kingdom of Israel",
    setting:
      "Hosea prophesies in the last decades of the northern kingdom. The reign of Jeroboam II had been prosperous, but after his death in about 753 BC the north collapsed into chaos: four of the next six kings were assassinated, and the state lurched between paying Assyria and appealing to Egypt. Religion had become a fertility cult, with the Lord worshipped in Baal's terms at shrines with sacred prostitution. Hosea's own marriage to an unfaithful wife, and his buying her back, is enacted prophecy. Samaria fell in 722 BC, within his lifetime or just after.",
    purpose:
      "To confront Israel's unfaithfulness and to declare God's refusal to abandon a people who deserve it.",
    themes: ["marriage as covenant image", "unfaithfulness and idolatry", "steadfast love", "knowledge of God", "judgement and restoration"]
  },
  {
    book: 29,
    author: "Joel son of Pethuel",
    written: "Uncertain; proposals range from the ninth to the fourth century BC",
    audience: "Judah and Jerusalem",
    setting:
      "The book opens on a devastating locust plague and drought that has stripped the fields, ended the grain and drink offerings at the temple, and reduced the country to famine. Joel treats the disaster as a summons: an army of insects becomes a picture of an invading army and of the day of the Lord. The temple is standing and the priests are functioning, but no king is mentioned, which is part of why the date is so hard to fix.",
    purpose:
      "To call Judah to repentance in the face of disaster and to announce both judgement and an outpouring of God's Spirit.",
    themes: ["the day of the Lord", "locusts and drought", "communal repentance", "the Spirit poured out on all flesh", "judgement of the nations"],
    note: "Joel gives no king and no datable event, so its date is genuinely open: some place it in the ninth century under Joash, others in the eighth, and many after the exile. Nothing in the book settles it."
  },
  {
    book: 30,
    author: "Amos of Tekoa, a herdsman and tender of sycamore figs",
    written: "Ministry c. 760-750 BC",
    audience: "The northern kingdom of Israel, delivered at Bethel",
    setting:
      "Amos was a Judean who went north to preach in Israel during the long, prosperous reign of Jeroboam II, when borders were secure and Assyria was temporarily distracted. Prosperity was concentrated: the excavated houses of the period show a widening gap between rich and poor, and Amos attacks debt-slavery, rigged scales, bribed courts and luxury built on the backs of the poor, all while the shrine at Bethel was busy with offerings. The priest Amaziah tries to expel him as a foreign agitator. Within about forty years the kingdom was gone.",
    purpose:
      "To announce judgement on a prosperous nation whose worship coexisted with systematic injustice.",
    themes: ["social injustice", "worship without righteousness", "the day of the Lord as darkness", "judgement on the nations", "a remnant restored"]
  },
  {
    book: 31,
    author: "Obadiah",
    written: "Most likely shortly after 586 BC; an earlier date is also argued",
    audience: "Judah, concerning Edom",
    setting:
      "The shortest book in the Old Testament, addressed against Edom, the nation descended from Esau, whose territory lay south-east of the Dead Sea in high, defensible rock country. The charge is specific: when Jerusalem was sacked, Edom stood by, looted, gloated and handed over fugitives trying to escape. Edomites later moved into the southern Judean hill country left empty by the deportation.",
    purpose:
      "To pronounce judgement on Edom for its treachery against Jerusalem and to affirm that the Lord rules over the nations.",
    themes: ["pride brought down", "treachery against a brother", "the day of the Lord", "restoration of Zion"],
    note: "Nothing in the book gives a date. The description of Jerusalem's sack fits 586 BC and most scholars read it that way, but some connect it to an earlier raid, in the ninth century."
  },
  {
    book: 32,
    author: "Anonymous; about Jonah son of Amittai, a prophet of the eighth century BC",
    written: "Uncertain; often dated after the exile",
    audience: "Israelites, on the question of God's mercy to enemies",
    setting:
      "Nineveh was a principal city of Assyria, the empire that would destroy the northern kingdom, deport its population, and become a byword for cruelty in its own royal inscriptions. Jonah is a real prophet named in 2 Kings 14 as having predicted the expansion of Israel's borders under Jeroboam II. The book turns on the fact that a prophet would rather die than see that city spared — and says so plainly at the end.",
    purpose:
      "To confront the reader with God's mercy toward an enemy nation and the prophet's resentment of it.",
    themes: ["running from God", "mercy to enemies", "repentance of a pagan city", "a prophet's anger", "God's concern for the nations"],
    note: "The genre is debated. Some read it as straightforward historical narrative, others as a didactic story or parable built around a historical prophet. The date of writing is likewise uncertain, with many scholars placing the book after the exile."
  },
  {
    book: 33,
    author: "Micah of Moresheth",
    written: "Ministry c. 740-700 BC",
    audience: "Both kingdoms, with the weight on Judah and Jerusalem",
    setting:
      "Micah was a contemporary of Isaiah but came from a small town in the Judean lowlands rather than the capital, and his anger is directed at what the ruling class in Jerusalem and Samaria was doing to country people: seizing fields, evicting families, judges taking bribes, priests teaching for pay and prophets prophesying for money. He watched Assyria roll through the region, saw Samaria destroyed in 722 BC, and lived through Sennacherib's devastation of the Judean countryside in 701 BC. A century later Jeremiah's defenders cited Micah's prediction of Jerusalem's ruin as precedent.",
    purpose:
      "To indict the leaders of both kingdoms for injustice and false religion, and to promise a ruler from Bethlehem.",
    themes: ["land seized from the poor", "corrupt leaders and prophets", "judgement on Samaria and Jerusalem", "a ruler from Bethlehem", "justice, mercy and humility"]
  },
  {
    book: 34,
    author: "Nahum the Elkoshite",
    written: "Between 663 and 612 BC",
    audience: "Judah, living under Assyrian domination",
    setting:
      "Assyria had been the terror of the Near East for two centuries, and its own annals boast of flaying prisoners and stacking heads. Nahum mentions the fall of Thebes in Egypt, which happened in 663 BC, as a past event, and predicts the fall of Nineveh, which happened in 612 BC to a coalition of Babylonians and Medes. The book is addressed to people who had paid tribute, lost relatives and watched neighbouring states erased.",
    purpose:
      "To announce the fall of Nineveh as God's judgement on a violent empire.",
    themes: ["judgement on empire", "God as avenger and refuge", "the fall of Nineveh", "the limits of military power"]
  },
  {
    book: 35,
    author: "Habakkuk",
    written: "Probably c. 610-600 BC",
    audience: "Judah, on the eve of the Babylonian invasions",
    setting:
      "Josiah's reform has failed to outlive him, Judah is again violent and corrupt, and Assyria is collapsing. Habakkuk asks why God tolerates injustice within Judah, and receives an answer worse than the question: God is raising up the Chaldeans, that bitter and hasty nation. Babylon defeated Egypt at Carchemish in 605 BC and was in Judah within years. The book is a dialogue between prophet and God rather than a message delivered to the people, and it ends in a psalm.",
    purpose:
      "To press the question of why God uses a more wicked nation to punish a less wicked one, and to arrive at trust without an answer.",
    themes: ["complaint to God", "the righteous shall live by faith", "the rise of Babylon", "waiting for the vision", "joy without harvest"]
  },
  {
    book: 36,
    author: "Zephaniah son of Cushi",
    written: "During the reign of Josiah, c. 640-620 BC",
    audience: "Judah and Jerusalem",
    setting:
      "Zephaniah prophesies under Josiah, most likely before or during the reform of 622 BC, after the long reigns of Manasseh and Amon had left Baal worship, astral cults, foreign dress at court and syncretism embedded in Jerusalem. He names those practices directly. The book's picture of the day of the Lord as a sweeping, near-cosmic judgement is the most severe in the minor prophets, and it ends with God singing over a purified remnant.",
    purpose:
      "To announce the day of the Lord against Judah and the nations, and to call for humility before it.",
    themes: ["the day of the Lord", "syncretism and complacency", "judgement on the nations", "a humble remnant", "God rejoicing over his people"]
  },
  {
    book: 37,
    author: "Haggai",
    written: "520 BC, with oracles precisely dated over about four months",
    audience: "The returned community in Jerusalem, with Zerubbabel and Joshua the high priest",
    setting:
      "The exiles had returned around 538 BC and laid a temple foundation, then stopped for roughly sixteen years under local opposition and hard times: poor harvests, inflation and drought. People had roofed their own houses while the temple site lay unfinished. Haggai's oracles, dated to the second year of Darius I, are addressed to the governor and high priest, and the work restarted; the temple was finished in 516 BC.",
    purpose:
      "To get the temple rebuilt and to reorder the community's priorities around it.",
    themes: ["rebuilding the temple", "misplaced priorities", "the glory of the later house", "encouragement to leaders"]
  },
  {
    book: 38,
    author: "Zechariah son of Berechiah; chapters 9-14 sometimes assigned to another hand",
    written: "From 520 BC; later chapters possibly later",
    audience: "The returned community in Jerusalem",
    setting:
      "Zechariah begins two months after Haggai and works alongside him to see the temple finished. The first eight chapters are night visions given to a small, discouraged province under Persian rule, addressing the question of whether God has really returned to Jerusalem. The last six change register entirely into oracles about a coming king, a shepherd struck, a fountain opened, and a final siege of Jerusalem; these chapters are quoted heavily in the passion narratives of the Gospels.",
    purpose:
      "To encourage the rebuilding of the temple and to hold out a larger hope of God's return and reign in Jerusalem.",
    themes: ["night visions", "cleansing of the priesthood", "a coming humble king", "the shepherd struck", "the Lord king over all the earth"],
    note: "Many scholars distinguish chapters 9-14 from 1-8 on grounds of style, form and subject matter, assigning them to a later anonymous prophet; others defend the unity of the book."
  },
  {
    book: 39,
    author: "Malachi; the name means 'my messenger' and may be a title",
    written: "c. 460-430 BC",
    audience: "Priests and people in Persian-period Judah",
    setting:
      "The temple has been standing for decades and the excitement has drained out of it. Priests are offering blind and lame animals, tithes go unpaid, men are divorcing their wives to marry into surrounding families, and people are saying openly that serving God is not worth it because the wicked prosper. The province is small, poor and politically irrelevant, and the grand promises of the returning prophets have not visibly arrived. Malachi is written as a series of disputes: God makes a charge, the people answer back, God replies.",
    purpose:
      "To confront cynicism and half-hearted worship in the restored community and to announce a coming messenger.",
    themes: ["contempt disguised as worship", "faithfulness in marriage", "tithes and robbery", "the messenger of the covenant", "the day that is coming"],
    note: "Whether Malachi is a personal name or simply the Hebrew for 'my messenger', taken from 3:1, has been argued since antiquity."
  },
  {
    book: 40,
    author: "Anonymous; early tradition names Matthew the tax collector",
    written: "Commonly c. AD 70-85; some argue for the 50s or 60s",
    audience: "Jewish Christians, probably in Syria or Palestine",
    setting:
      "Written for readers who knew the Hebrew scriptures well and needed to know how Jesus related to them. If the common dating is right, it comes from the years around or after the Roman destruction of Jerusalem in AD 70, when the temple was gone, the priesthood had lost its function, and Pharisaic Judaism was reorganising Jewish life around law and synagogue. The sharp disputes with scribes and Pharisees in this Gospel read against that background, as an argument within Judaism about who rightly interprets the law. The genealogy, the formula quotations and the five great blocks of teaching all present Jesus as the fulfilment of Israel's story.",
    purpose:
      "To present Jesus as the promised Messiah and teacher of a righteousness that fulfils the law, and to commission his followers to the nations.",
    themes: ["fulfilment of scripture", "the kingdom of heaven", "Jesus as new Moses and son of David", "discipleship and righteousness", "conflict with the religious leadership", "mission to all nations"],
    note: "All four Gospels are formally anonymous; the titles are early but not part of the text. The relationship among the first three Gospels is debated, most holding that Matthew and Luke used Mark."
  },
  {
    book: 41,
    author: "Anonymous; early tradition names Mark, associated with Peter",
    written: "Commonly c. AD 65-70",
    audience: "Gentile Christians, traditionally in Rome",
    setting:
      "The likely setting is the Roman church around the persecution under Nero, which began in AD 64 and in which Christians were executed as scapegoats for the fire of Rome, and the Jewish revolt of AD 66-70. The Gospel explains Jewish customs and translates Aramaic phrases, which points to Gentile readers, and it uses Latin loanwords. It is the shortest and fastest of the Gospels, and it spends a disproportionate share of its length on the final week; its repeated theme that following Jesus means the cross had immediate application to readers who might face it.",
    purpose:
      "To tell the story of Jesus as the Son of God whose identity is disclosed in his death, and to define discipleship by the cross.",
    themes: ["the suffering Son of God", "secrecy and disclosure", "immediacy and action", "failure of the disciples", "cross-shaped discipleship"]
  },
  {
    book: 42,
    author: "Anonymous; early tradition names Luke, a physician and companion of Paul",
    written: "Commonly c. AD 75-85; some argue for the early 60s",
    audience: "Theophilus, and Gentile Christians generally",
    setting:
      "The first volume of a two-part work continued in Acts, addressed to a named patron and written in polished Greek with a formal preface, in the manner of Hellenistic historiography. It anchors the story in imperial and provincial history — Augustus, Quirinius, Tiberius, Pilate, Herod, Annas and Caiaphas — for readers in the wider Roman world who needed the events placed in real time. Its distinctive material gives unusual attention to women, the poor, Samaritans, tax collectors and outsiders, in a society organised around honour, patronage and status.",
    purpose:
      "To give an ordered account of the events concerning Jesus so that a Gentile reader may know their reliability.",
    themes: ["an orderly historical account", "concern for the poor and the outsider", "prayer and the Holy Spirit", "salvation for all peoples", "reversal of status", "joy"]
  },
  {
    book: 43,
    author: "Anonymous; traditionally John the apostle or the 'beloved disciple'",
    written: "Commonly c. AD 85-95",
    audience: "Christians facing expulsion from the synagogue, traditionally in Ephesus",
    setting:
      "This Gospel comes out of a later situation than the other three, in which believing in Jesus had begun to cost Jewish Christians their place in the synagogue — it three times refers to being put out. It is written in simple Greek but with sustained symbolic depth: seven signs, seven 'I am' sayings, long discourses rather than short sayings and parables. Its world includes Samaritans, Greeks seeking Jesus, and a Roman governor who cares only about sedition. Much of it is set at Jewish festivals in Jerusalem, with Jesus presented as what each festival signified.",
    purpose:
      "That readers may believe Jesus is the Christ, the Son of God, and have life in his name.",
    themes: ["the Word made flesh", "signs and belief", "light and darkness", "eternal life now", "the Spirit promised", "love within the community"],
    note: "The Gospel names its source only as the disciple whom Jesus loved. Tradition identifies him as John son of Zebedee; scholars differ over whether that identification holds and over how much of the final form comes from a later editor."
  },
  {
    book: 44,
    author: "The author of Luke's Gospel",
    written: "Same date as Luke; commonly c. AD 75-85",
    audience: "Theophilus and Gentile Christian readers",
    setting:
      "Acts follows the movement of the message from Jerusalem to Rome across about thirty years, through a Mediterranean world unified by Roman roads, Greek as a common language, and a network of Jewish synagogues in nearly every major city. Those synagogues, with their Gentile sympathisers, were the first point of contact almost everywhere. The book turns on a controversy the modern reader can underestimate: whether Gentiles could belong to a Jewish messianic movement without circumcision. Roman officials appear repeatedly, usually treating the disputes as internal to Judaism and beneath their concern.",
    purpose:
      "To trace how the gospel spread from Jerusalem to Rome and how the church became a community of Jews and Gentiles together.",
    themes: ["the Holy Spirit driving the mission", "Jerusalem to Rome", "Gentile inclusion", "persecution and growth", "preaching and defence speeches"]
  },
  {
    book: 45,
    author: "Paul, dictated to Tertius",
    written: "c. AD 57, from Corinth",
    audience: "The church in Rome, which Paul had not yet visited",
    setting:
      "Rome's church was mixed, Jewish and Gentile, and had passed through a rupture: Claudius expelled Jews from the city around AD 49, leaving a Gentile congregation, and after his death in AD 54 the Jewish believers returned to a church that had reorganised without them. The frictions over food, holy days and who has priority in God's plan are addressed directly in chapters 14-15. Paul writes ahead of a visit, hoping for support for a mission to Spain, and while carrying a collection from Gentile churches to the poor in Jerusalem — a gift meant to hold the two halves of the church together.",
    purpose:
      "To set out Paul's gospel in full to a church he did not found, and to secure its support and its unity across the Jew-Gentile divide.",
    themes: ["righteousness of God by faith", "sin and grace", "life in the Spirit", "the place of Israel", "unity of Jew and Gentile", "practical obedience"]
  },
  {
    book: 46,
    author: "Paul, with Sosthenes",
    written: "c. AD 55, from Ephesus",
    audience: "The church at Corinth",
    setting:
      "Corinth was a Roman colony refounded in 44 BC, a port city on the isthmus controlling trade in both directions, wealthy, socially mobile and full of newcomers competing for status. It housed temples to many gods, and meat sold in the markets had often been sacrificed in them; dinner invitations to temple dining rooms were ordinary social life. The church met in households, which meant that the wealthy host and his poor members ate the same meal in different rooms and different quantities. Paul is answering both an oral report from Chloe's people and a letter of questions from the church itself, on factions, a case of incest, lawsuits, marriage, food, worship, spiritual gifts and the resurrection.",
    purpose:
      "To correct divisions and disorder in a young church and to reframe its questions around the cross and the good of others.",
    themes: ["divisions and party spirit", "the cross versus worldly wisdom", "sexual ethics", "freedom limited by love", "order in worship and gifts", "the resurrection of the body"]
  },
  {
    book: 47,
    author: "Paul, with Timothy",
    written: "c. AD 55-56, from Macedonia",
    audience: "The church at Corinth",
    setting:
      "Relations have broken down since the first letter. Paul made a painful visit, wrote a severe letter now lost, and has been waiting anxiously for news, which reaches him through Titus in Macedonia. Rival teachers have arrived in Corinth with letters of recommendation, impressive speaking and, apparently, a willingness to charge for their services, and they have persuaded the church that Paul's weakness, plain speech and refusal of support prove he is not a real apostle. Much of the letter is therefore a defence that argues from weakness rather than against it, alongside practical arrangements for the collection for Jerusalem.",
    purpose:
      "To repair a damaged relationship, defend Paul's apostleship against rivals, and complete the collection for the poor in Jerusalem.",
    themes: ["comfort in affliction", "ministry of the new covenant", "power in weakness", "generosity and the collection", "defence against rival apostles", "reconciliation"]
  },
  {
    book: 48,
    author: "Paul",
    written: "c. AD 48-49 or c. AD 53-55, depending on the destination",
    audience: "Churches in Galatia",
    setting:
      "Teachers had followed Paul into Galatia arguing that Gentile converts must be circumcised and keep the law to belong fully to God's people. That was not an eccentric position: the promises had been made to Israel, and circumcision was the covenant sign given to Abraham. The pressure may also have been practical, since being recognised as Jewish carried legal protections in the empire that a new sect did not have. Paul treats the issue as the survival of the gospel itself, and the letter is his angriest — it is the only one with no thanksgiving after the greeting.",
    purpose:
      "To insist that Gentiles are justified by faith in Christ apart from the works of the law, and that adding circumcision destroys the gospel.",
    themes: ["justification by faith", "law and promise", "freedom in Christ", "the Spirit versus the flesh", "Abraham's true children"],
    note: "Two views compete on destination and date. The south Galatian view takes the recipients as the churches of Acts 13-14 and dates the letter before the Jerusalem council of Acts 15, making it possibly Paul's earliest. The north Galatian view places it among ethnic Galatians further north and dates it in the mid-50s."
  },
  {
    book: 49,
    author: "Paul; authorship disputed",
    written: "c. AD 60-62 if by Paul, from prison; later if not",
    audience: "Christians in Ephesus and the surrounding region; the earliest manuscripts lack 'in Ephesus'",
    setting:
      "Ephesus was the leading city of the province of Asia, home to the temple of Artemis, one of the wonders of the ancient world, and a centre for magic — Acts describes converts burning expensive books of spells there. The letter's talk of principalities, powers and rulers of this darkness addressed people who had lived in real fear of hostile spiritual forces. Unlike most of Paul's letters it answers no specific crisis and names almost no individuals, which is one reason it is often thought to be a circular letter to several congregations.",
    purpose:
      "To set out God's purpose to unite all things in Christ and to shape a church of Jews and Gentiles into one household living accordingly.",
    themes: ["God's eternal purpose", "one new humanity from Jew and Gentile", "the church as body and temple", "household relationships", "spiritual conflict"],
    note: "Authorship is disputed. The letter claims Paul, and the tradition is early, but its vocabulary, long sentences and developed view of the church lead many scholars to regard it as written by a disciple in Paul's name; others answer that a circular letter written without a crisis would naturally differ in style."
  },
  {
    book: 50,
    author: "Paul, with Timothy",
    written: "c. AD 61-62 from Rome, or earlier from Ephesus",
    audience: "The church at Philippi",
    setting:
      "Philippi was a Roman colony in Macedonia settled with army veterans, proud of its citizenship and Roman in law and manners; the language of citizenship in the letter would have landed there. It was the first church Paul founded in Europe, and it alone sent him money repeatedly. He writes from custody, guarded and awaiting a verdict that could go either way, while the church at Philippi faces opposition of its own and a quarrel between two prominent women. Epaphroditus has come from Philippi with a gift and nearly died; the letter goes back with him.",
    purpose:
      "To thank the Philippians for their support, report on Paul's imprisonment, and urge unity and steadfastness.",
    themes: ["joy in imprisonment", "humility of Christ", "unity and shared struggle", "citizenship in heaven", "contentment and generosity"]
  },
  {
    book: 51,
    author: "Paul, with Timothy; authorship disputed by some",
    written: "c. AD 60-62 if by Paul, from prison",
    audience: "The church at Colossae, founded by Epaphras rather than Paul",
    setting:
      "Colossae was a declining town in the Lycus valley in Asia Minor, near Laodicea and Hierapolis; it was damaged by an earthquake around AD 60. Paul had never been there. A teaching had taken hold that combined ascetic practice, festival and food rules, visions and some form of veneration of angels, offering fuller access to the divine than Christ alone. The letter answers not by refuting each element but by describing the supremacy and sufficiency of Christ, and it travels with Onesimus and the letter to Philemon.",
    purpose:
      "To establish the sufficiency of Christ against a teaching that treated him as insufficient.",
    themes: ["the supremacy of Christ", "fullness of deity in bodily form", "freedom from ascetic rules", "the new self", "household conduct"],
    note: "Most accept Pauline authorship, though a minority argue on stylistic grounds for a close associate writing in his name."
  },
  {
    book: 52,
    author: "Paul, with Silvanus and Timothy",
    written: "c. AD 50-51, from Corinth",
    audience: "The young church at Thessalonica",
    setting:
      "Thessalonica was the capital of Macedonia and a free city on the main Roman road east to west. Paul's stay was cut short by a riot in which his hosts were dragged before the city officials on the charge of proclaiming another king, Jesus — a serious accusation in a city that had built its standing on loyalty to Rome. He left after a matter of weeks and was anxious about whether the converts had survived the pressure. Timothy has now returned with good news, and this letter is the reply, probably the earliest of Paul's surviving letters.",
    purpose:
      "To encourage a new church under pressure and to answer its worry about Christians who had died before Christ's return.",
    themes: ["faith under persecution", "the return of Christ", "the dead in Christ", "holiness and honest work", "encouragement and hope"]
  },
  {
    book: 53,
    author: "Paul, with Silvanus and Timothy; authorship disputed by some",
    written: "c. AD 51-52, shortly after the first letter",
    audience: "The church at Thessalonica",
    setting:
      "The situation of the first letter has worsened in a specific way: someone has claimed, possibly by a forged letter in Paul's name, that the day of the Lord has already come. Some in the church had stopped working, presumably in expectation of the end, and were living off others. Persecution continues. Paul answers with a sequence of events that must precede the day, and with a blunt instruction about work, and he signs the letter in his own hand as a mark of authenticity.",
    purpose:
      "To correct a false claim that the day of the Lord had arrived, and to deal with idleness in the church.",
    themes: ["the day of the Lord", "the man of lawlessness", "steadfastness under persecution", "work and idleness"],
    note: "A minority of scholars question Pauline authorship on the grounds of its differences from 1 Thessalonians in tone and eschatology; the majority accept it."
  },
  {
    book: 54,
    author: "Paul; authorship disputed",
    written: "c. AD 62-64 if by Paul; late first or early second century if not",
    audience: "Timothy, left in charge at Ephesus",
    setting:
      "The letter presupposes a church in Ephesus troubled by teachers producing speculation out of genealogies and myths, forbidding marriage and certain foods, and in at least some cases making money from it. Timothy is young and evidently finding the assignment hard. The instructions concern the ordinary machinery of a congregation that expects to last: qualifications for overseers and deacons, care of widows, the pay and discipline of elders, and conduct in the assembly. This letter and Titus deal with the same situation and share vocabulary and phrasing.",
    purpose:
      "To instruct Timothy on countering false teaching and ordering the life and leadership of the church.",
    themes: ["sound teaching", "qualifications for leaders", "care of widows", "godliness with contentment", "conduct in the household of God"],
    note: "The Pastoral Epistles (1-2 Timothy, Titus) are the most contested of the letters claiming Paul. Their vocabulary and style differ markedly from the undisputed letters and their church order looks developed; the travels they assume do not fit Acts. Defenders answer that Acts does not cover Paul's last years, that a different secretary and a different subject would change the style, and that the personal detail is hard to explain as invention."
  },
  {
    book: 55,
    author: "Paul; authorship disputed with the other Pastorals",
    written: "c. AD 64-67 if by Paul, from imprisonment in Rome",
    audience: "Timothy",
    setting:
      "Presented as Paul's last letter, written in chains under conditions harsher than his earlier house arrest, expecting execution. He says that everyone in Asia has deserted him and that at his first defence no one stood with him. He asks Timothy to come before winter and to bring a cloak and his books. Whether or not Paul wrote it, the letter is set in the transition from the first generation of apostles to those who must carry the message after them, and its instruction is to guard what was entrusted and pass it on.",
    purpose:
      "To charge Timothy to hold to and pass on the apostolic message, whatever the cost.",
    themes: ["guarding the deposit", "endurance in suffering", "scripture as breathed out by God", "handing on to faithful men", "abandonment and faithfulness"],
    note: "See the note on 1 Timothy; the same authorship debate covers this letter, though its personal detail is often felt to be its strongest argument for authenticity."
  },
  {
    book: 56,
    author: "Paul; authorship disputed with the other Pastorals",
    written: "c. AD 62-66 if by Paul",
    audience: "Titus, left on Crete",
    setting:
      "Crete had a poor reputation in the ancient world, which the letter itself cites by quoting a Cretan poet's insult about his own people. The churches there are new and unstructured, with no appointed elders, and there are teachers, described as of the circumcision party, disrupting households for money. The instructions are terse and organisational: appoint elders town by town, silence the disruptors, and teach different groups within the congregation how to live in a way that will not discredit the message among their neighbours.",
    purpose:
      "To have Titus appoint elders and put the Cretan churches in order against disruptive teaching.",
    themes: ["appointing elders", "sound doctrine and good works", "grace that trains", "conduct that commends the gospel"],
    note: "See the note on 1 Timothy; Titus is part of the same disputed group."
  },
  {
    book: 57,
    author: "Paul, with Timothy",
    written: "c. AD 60-62, from prison",
    audience: "Philemon, a wealthy Christian in Colossae, and the church that met in his house",
    setting:
      "Onesimus, a slave belonging to Philemon, has left, apparently having wronged his master financially, and has come to Paul in prison, where he has become a Christian. Roman law gave an owner broad power over a returning runaway, including branding, flogging or worse, and third parties who harboured slaves were liable. Paul sends him back carrying this letter, which is addressed not only to Philemon but to the congregation meeting in his house, so the response will be public. Paul offers to cover the debt himself and asks for Onesimus to be received as a brother.",
    purpose:
      "To ask Philemon to receive Onesimus back not as a slave but as a brother in Christ.",
    themes: ["appeal rather than command", "a slave received as a brother", "debt assumed by another", "reconciliation within the church"]
  },
  {
    book: 58,
    author: "Anonymous",
    written: "Probably before AD 70; some argue slightly later",
    audience: "Jewish Christians under pressure to return to the synagogue",
    setting:
      "The readers are second-generation believers who have already suffered loss of property and public abuse, and are now drifting: some have stopped meeting. The pull is back toward the temple system, with its priesthood, sacrifices and legal standing, all of which the letter treats as still operating — a reason many date it before the temple's destruction in AD 70. Its argument is a sustained comparison: the son is greater than angels, Moses, Aaron's priesthood and the sacrifices, and the covenant he mediates is the one Jeremiah promised. It reads as a sermon rather than a letter, and its warnings against falling away are the severest in the New Testament.",
    purpose:
      "To show the finality of Christ over everything that came before, and so to keep wavering believers from turning back.",
    themes: ["Christ superior to angels, Moses and priests", "the true high priest", "a better covenant and sacrifice", "warnings against drifting away", "faith and endurance"],
    note: "The author is unknown. The letter never names one, and the early church was divided; Paul, Barnabas, Apollos, Luke, Clement and Priscilla have all been proposed. Origen's remark that only God knows who wrote it still stands."
  },
  {
    book: 59,
    author: "James, most likely the brother of Jesus and leader of the Jerusalem church",
    written: "Possibly as early as the 40s AD, or later in the first century",
    audience: "Jewish Christians scattered outside Palestine",
    setting:
      "Addressed to the twelve tribes in the dispersion, the letter reads as practical instruction in the manner of Jewish wisdom teaching, with short imperatives and vivid images rather than sustained argument. Its congregations are poor and being exploited: wealthy men drag them into court, favoured seats are given to visitors with gold rings, and day labourers go unpaid by landowners who harvest their fields. James was martyred in Jerusalem around AD 62 according to Josephus. His insistence that faith without works is dead has long been read against Paul, though the two use the word 'works' differently.",
    purpose:
      "To press that real faith shows itself in conduct — in speech, in the treatment of the poor, and under trial.",
    themes: ["faith proved by works", "the tongue", "partiality and the poor", "wisdom from above", "patience under trial", "prayer"],
    note: "Attribution to James the Lord's brother is traditional and widely though not universally accepted; the polished Greek is sometimes raised against it, and the date accordingly ranges from the 40s to near the end of the century."
  },
  {
    book: 60,
    author: "Peter, through Silvanus",
    written: "c. AD 62-64, from 'Babylon', generally understood as Rome",
    audience: "Christians in five provinces of northern Asia Minor",
    setting:
      "The readers are described as exiles and strangers, mostly Gentile converts scattered across Pontus, Galatia, Cappadocia, Asia and Bithynia. The persecution in view is social rather than official at this stage: slander, exclusion, abuse from neighbours and household hostility toward slaves and wives who had adopted a religion their masters and husbands had not. Refusing to join in civic and household worship marked converts as antisocial and disloyal. The letter tells them to live in a way that leaves the accusations without foundation, and to expect suffering as normal rather than surprising.",
    purpose:
      "To steady believers under hostility by grounding their identity in Christ's suffering and their coming inheritance.",
    themes: ["living as exiles", "suffering unjustly", "a living hope", "holy conduct before outsiders", "submission and witness", "shepherding the flock"]
  },
  {
    book: 61,
    author: "Peter; authorship disputed",
    written: "c. AD 65-68 if by Peter; second century in the view of many scholars",
    audience: "Christians facing teachers who mocked the promise of Christ's return",
    setting:
      "The problem is teachers inside the church who deny the coming judgement, arguing that nothing has changed since the beginning, and who use that denial to license greed and sexual exploitation. Enough time has passed that the delay is itself an argument, and the first generation is dying. The letter refers to Paul's letters as a collection, and describes them as being twisted like the other scriptures. Its second chapter overlaps closely with Jude.",
    purpose:
      "To confront teachers who deny Christ's return and to hold believers to the apostolic message.",
    themes: ["the delay of the Lord's coming", "false teachers", "growth in knowledge and virtue", "the day of the Lord", "scripture and its interpretation"],
    note: "This is the most widely doubted book in the New Testament. Its Greek differs sharply from 1 Peter, it seems to know Jude and a collection of Paul's letters, and it was accepted into the canon later and more hesitantly than most books. Defenders point to the explicit claim of authorship and the possibility of a different secretary."
  },
  {
    book: 62,
    author: "'The elder'; traditionally John the apostle",
    written: "c. AD 85-95",
    audience: "Churches in the area of Ephesus, in the same circle as John's Gospel",
    setting:
      "A group has left the congregation and is teaching that Jesus did not come in the flesh — an early form of the view that a divine being could not truly take a body, and that salvation therefore lies in knowledge rather than in a real death. The departure has left those who remain unsettled about who is right. The letter has no greeting, no named sender and no named recipients, and works instead by giving tests: belief about Christ, obedience, and love for fellow believers.",
    purpose:
      "To reassure believers of what they have, after a group of teachers left, and to give them tests of true faith.",
    themes: ["Jesus come in the flesh", "walking in the light", "love for one another", "tests of genuine faith", "assurance"],
    note: "The three letters of John and the Gospel are traditionally assigned to John the apostle. Scholars variously assign them to the apostle, to another figure known as John the elder, or to a school of writers in that circle."
  },
  {
    book: 63,
    author: "'The elder'",
    written: "c. AD 85-95",
    audience: "'The elect lady and her children', most likely a congregation and its members",
    setting:
      "A very short letter, the length of a single sheet of papyrus. Travelling teachers depended on hospitality from local believers, who housed and provisioned them and thereby endorsed them. The letter tells this congregation not to extend that hospitality to teachers who deny that Jesus came in the flesh, because to house them is to share in the work. The same conflict as 1 John, treated as a practical question about the front door.",
    purpose:
      "To warn a congregation against hosting and so supporting teachers who deny the incarnation.",
    themes: ["truth and love together", "hospitality as endorsement", "deceivers", "walking in the commandments"]
  },
  {
    book: 64,
    author: "'The elder'",
    written: "c. AD 85-95",
    audience: "Gaius, a believer in one of the congregations",
    setting:
      "The mirror image of the second letter. Here the problem is refused hospitality: Diotrephes, who likes to put himself first in a particular church, will not receive the elder's emissaries, speaks against him, and expels those who do receive them. Gaius has been supporting travelling missionaries and is commended for it. The dispute is over authority and reception in congregations that had no formal structure beyond household churches and personal reputation.",
    purpose:
      "To commend Gaius for supporting travelling workers and to confront Diotrephes for refusing them.",
    themes: ["hospitality to travelling workers", "authority contested", "imitating good rather than evil", "commendation and rebuke"]
  },
  {
    book: 65,
    author: "Jude, brother of James and so of Jesus",
    written: "Probably c. AD 65-80",
    audience: "Christians infiltrated by immoral teachers",
    setting:
      "Jude says he had intended to write about salvation in general but changed his subject because of an emergency: teachers had come in unnoticed who treated grace as licence for sexual immorality and who rejected authority. His examples come from Israel's history and from Jewish literature outside the Old Testament — he cites 1 Enoch by name and alludes to a dispute over the body of Moses found in the Assumption of Moses — which tells us something about what his readers read. Much of his material runs parallel to 2 Peter 2.",
    purpose:
      "To urge believers to contend for the faith against teachers who had entered the church.",
    themes: ["contending for the faith", "immorality passed off as grace", "warnings from Israel's history", "judgement on false teachers", "keeping oneself in God's love"]
  },
  {
    book: 66,
    author: "John; identification and date disputed",
    written: "Commonly c. AD 95, in the reign of Domitian; some argue for the late 60s",
    audience: "Seven churches in the Roman province of Asia",
    setting:
      "Written from Patmos, a small Aegean island, to seven real congregations whose circumstances the opening chapters describe individually: some poor and harassed, some wealthy and complacent, one where a believer named Antipas had been killed. Life in the cities of Asia was saturated with the imperial cult; Ephesus, Smyrna and Pergamum all held temples to Rome and the emperor, and participation in civic festivals and trade guilds carried religious obligation. Refusal meant loss of livelihood and suspicion of disloyalty. The book is written in the apocalyptic idiom familiar from Daniel and Jewish literature of the period, in symbols — beasts, numbers, colours — that convey what could not safely be said plainly.",
    purpose:
      "To disclose the reign of God and the Lamb behind a world of imperial power, and to hold seven churches faithful under pressure.",
    themes: ["the Lamb who was slain", "worship of God against worship of empire", "judgement on Babylon", "endurance of the saints", "a new heaven and new earth"],
    note: "Two dates are argued: the late 90s under Domitian, following the second-century testimony of Irenaeus, and the late 60s under Nero, which some prefer on internal grounds. The author names himself John but does not call himself an apostle, and whether he is the author of the Gospel and letters has been debated since the third century."
  }
]

export const ERA_CONTEXT: EraContext[] = [
  {
    era: "primeval",
    background:
      "The opening chapters of Genesis stand before any datable history. They are set in Mesopotamia — the garden watered by rivers including the Tigris and Euphrates, the ark coming to rest in the mountains of Ararat, the tower built on the plain of Shinar, which is Babylonia — and they are told in a form that other peoples of that region also used to explain the world's beginning.\n\nThat matters for reading them. Babylonian literature preserves its own creation account, in which the world is made from the corpse of a defeated goddess and humans are made to do the gods' labour, and its own flood story, in which the gods send a deluge because human noise disturbs their sleep and a warned survivor builds a boat and releases birds. The Genesis accounts share the shape and much of the furniture of those stories while disagreeing with them at every point that matters: one God who is not part of the world he makes, humanity made in his image rather than as a labour force, and a flood that comes as moral judgement rather than divine irritation. The sun and moon, gods elsewhere in the region, are not even named here — only called the greater and lesser lights.\n\nThe genealogies then narrow the focus from all humanity to one line, and the tower of Babel — a ziggurat, the stepped temple tower characteristic of Mesopotamian cities — sets up the scattering of the nations that the call of Abraham answers.",
    world:
      "If the events are placed in the third millennium BC, the wider world is that of early Sumer and Akkad: cities of tens of thousands at Uruk, Ur, Lagash and Kish, the first writing on clay, irrigation agriculture, ziggurats, and the beginnings of empire under Sargon of Akkad around 2334 BC. In Egypt the Old Kingdom was building the pyramids at Giza. Genesis itself gives no dates, and the relation between its early chapters and this record is one of the most disputed questions in biblical interpretation."
  },
  {
    era: "patriarchs",
    background:
      "Abraham's world is the Middle Bronze Age, usually placed somewhere around 2000-1800 BC. He is a semi-nomadic herdsman who moves with flocks, servants and tents between grazing land and wells, buys a burial cave from a local landowner, and negotiates treaties with the rulers of small towns. He owns no territory in Canaan except a grave.\n\nCanaan at the time was a corridor rather than a country: a strip of hill country and coastal plain between Egypt to the south and the Mesopotamian powers to the north, dotted with small walled towns each with its own ruler and its own gods. Religion was local and transactional — a god of a place, a god of a household — and family survival depended on sons. Against that background the promises made to Abraham are pointed: land he does not own, descendants he does not have, and blessing to nations not his own.\n\nThe social customs in these chapters were normal legal practice, documented in tablets from Mesopotamian cities: a childless couple adopting a servant as heir, a barren wife providing her slave as a surrogate, household gods carrying inheritance rights, a birthright transferable by agreement, and covenants ratified by cutting animals in two. The Joseph narrative then moves the family to Egypt, where Semitic officials in Egyptian administration and Semitic settlement in the eastern Delta are both attested."
    ,
    world:
      "Egypt passed from the Middle Kingdom into a period when a Semitic dynasty known as the Hyksos ruled the Delta from Avaris. In Mesopotamia the city of Babylon rose under Hammurabi, whose law code, inscribed around 1750 BC, shares subject matter and sometimes wording with later biblical law. Assyrian merchant colonies traded into Anatolia, Minoan Crete was at its height, and the horse and chariot were transforming warfare across the region."
  },
  {
    era: "exodus",
    background:
      "Israel enters this era as forced labour in Egypt and leaves it as a covenant people camped on the edge of Canaan. Egypt in the late Bronze Age was the wealthiest and most centralised state in the world, its Pharaoh regarded as a god, its economy dependent on the Nile flood and on conscripted labour for state building projects. Store cities in the Delta are exactly what such a labour force would build.\n\nThe date of the exodus is debated. The early date, around 1446 BC, follows the figure of 480 years before Solomon's temple given in 1 Kings 6 and places the departure under Amenhotep II. The late date, in the thirteenth century under Rameses II, is preferred by many on archaeological grounds and because of the city named Rameses. The biblical text does not name the Pharaoh.\n\nThe plagues are aimed at particular Egyptian deities — the Nile, the sun, cattle, and finally the heir of the divine king himself. What follows at Sinai is a covenant in the form of a treaty between a great king and a vassal, of the kind Hittite emperors imposed on subject states: a historical preamble recounting what the king has done, then stipulations, then witnesses, blessings and curses. Israel receives law, a portable sanctuary and a priesthood, and then spends a generation in the wilderness after refusing to enter the land."
    ,
    world:
      "This is the height of the late Bronze Age international system, in which the great powers — Egypt, the Hittite empire in Anatolia, Assyria, Babylon and Mitanni — corresponded in Akkadian, exchanged daughters in marriage and fought over Syria; the battle of Kadesh between Rameses II and the Hittites around 1274 BC ended in the first known peace treaty. The Amarna letters from the fourteenth century show Canaanite city rulers writing to Egypt begging for troops. Toward the end of the period the whole system collapsed, with the Hittite empire destroyed and the Sea Peoples, among them the Philistines, moving into the eastern Mediterranean."
  },
  {
    era: "conquest",
    background:
      "Israel enters Canaan as a tribal confederation without a king, a capital, a standing army or a central sanctuary beyond the tabernacle, first at Gilgal and later at Shiloh. The land it enters is a patchwork of small city-states, each with a king, walls and territory of a few miles: Jericho, Ai, Gezer, Lachish, Hazor. Egyptian control of the region was weakening but had not vanished.\n\nAfter the campaigns of Joshua the land is allotted by tribe, but large areas remain unconquered — the coastal plain in Philistine hands, the fortified valley towns held by Canaanites with iron chariots, Jerusalem still Jebusite. The book of Judges describes what followed: two centuries in which the tribes lived alongside the peoples they had not driven out, adopted their gods, and fell under pressure from Moabites, Midianites, Ammonites, Canaanites and above all the Philistines, who held a monopoly on ironworking. Deliverers rose locally and temporarily; there was no continuing institution of government.\n\nReligiously this is the period in which Israel's chief temptation is defined. Baal was the storm god who made crops grow, and a farming people newly settled on land whose agriculture they did not yet understand had every practical reason to hedge. The recurring judgement of the era is that everyone did what was right in his own eyes."
    ,
    world:
      "The eastern Mediterranean was in the aftermath of the late Bronze Age collapse: palace civilisations gone, Mycenaean Greece fallen into its dark age, the Hittite empire destroyed, Egypt shrunk back to its own borders, and no great power able to project force into Canaan. That vacuum is why a confederation of tribes could establish itself at all. It was also the era in which iron gradually replaced bronze, and in which the Phoenician cities of the coast began the trading expansion that would spread the alphabet."
  },
  {
    era: "united",
    background:
      "The monarchy begins under Philistine pressure. The Philistines had destroyed Shiloh and captured the ark, and the tribes' ad hoc system of deliverers was failing against a well-armed, organised enemy. The demand for a king is explicitly a demand to be like the other nations, and Samuel warns what a king will cost: conscription, taxation, forced labour.\n\nSaul's reign, from about 1050 BC, is essentially a permanent Philistine war conducted by a man whose authority was never institutionally secure and who ended it on Mount Gilboa. David, from about 1010 BC, takes Jerusalem — a Jebusite stronghold belonging to no tribe — makes it his capital, brings the ark there, and turns a tribal league into a small empire, subduing Philistia, Moab, Ammon, Edom and the Aramean states. He could do this because Egypt and Assyria were both weak; there was a window of perhaps a century in which a local power could dominate the corridor between them, and David and Solomon occupied it.\n\nSolomon, from about 970 BC, consolidated rather than conquered: a temple built with Phoenician materials and craftsmen, fortified cities, chariot forces, trade in horses and luxury goods, marriage alliances with foreign courts, and administrative districts that cut across tribal lines. It was paid for by taxation and forced labour, and the northern tribes' resentment of both broke the kingdom apart on his death in 931 BC."
    ,
    world:
      "Assyria and Egypt were both in decline, which is the single most important fact about this era; the empire David built would have been impossible a century earlier or two centuries later. Phoenicia flourished under Hiram of Tyre, trading across the Mediterranean and supplying Solomon with cedar, craftsmen and ships. In Egypt the Twenty-first Dynasty was weak and divided, though a resurgent Pharaoh, Shishak, invaded Judah within five years of Solomon's death."
  },
  {
    era: "divided",
    background:
      "In 931 BC the kingdom split. Rehoboam refused to lighten Solomon's forced labour, and ten northern tribes seceded under Jeroboam, who set up rival sanctuaries with golden calves at Bethel and Dan so that his people would not go up to Jerusalem to worship. From then on there were two states: Israel in the north, larger, richer, more exposed and politically unstable, with nine dynasties in two centuries; and Judah in the south, poorer and more isolated, but ruled by David's line without interruption.\n\nThis is the era of the writing prophets. They appear not as religious commentators but as political actors in a world of shifting alliances, denouncing kings by name, opposing treaties with Egypt and Assyria, and attacking the treatment of the poor in a period when land was being consolidated into large estates and small farmers reduced to debt slavery. Elijah and Elisha confront Ahab and Jezebel, who were promoting Tyrian Baal as state religion in the north. Amos and Hosea preach in Israel's last decades, Isaiah and Micah in Judah.\n\nAssyria dominates the period from the mid-eighth century. Tiglath-pileser III turned tribute-taking into annexation and mass deportation; Samaria fell in 722 BC and the northern population was scattered and replaced with settlers from elsewhere. Judah survived as a tributary, endured Sennacherib's invasion in 701 BC, oscillated between reform under Hezekiah and Josiah and relapse under Manasseh, and outlived Assyria only to face Babylon."
    ,
    world:
      "Assyria became the first empire to hold the whole Near East from Iran to Egypt, with a professional army, siege engineering and a policy of deporting conquered populations to break their identity. Its collapse was rapid: Nineveh fell in 612 BC to Babylonians and Medes, and Egypt's attempt to prop it up ended at Carchemish in 605 BC, where Nebuchadnezzar took the region for Babylon. Elsewhere in these centuries Rome was founded by tradition in 753 BC, the Greek city-states were colonising the Mediterranean, Homer's epics took shape, and the first Olympic games were held."
  },
  {
    era: "exile",
    background:
      "Judah fell in stages. Jerusalem submitted in 597 BC and Nebuchadnezzar deported the king, the court, the craftsmen and the leading families, Ezekiel among them. The puppet king Zedekiah rebelled anyway, counting on Egypt, and in 587/586 BC the Babylonians took the city, burned the temple, broke down the walls, executed officials, blinded the king and deported most of the rest. A remnant left in the land murdered the appointed governor and fled to Egypt, taking Jeremiah with them.\n\nWhat had ended was not just a state. The temple where God was said to dwell was ash, the dynasty promised to David was in a prison cell, the land given to Abraham was in other hands, and the sacrificial system was simply not available. The obvious conclusion by the standards of the ancient world was that Babylon's gods had beaten Israel's, and the exilic prophets spend their strength refuting it: the disaster was the covenant God's own act of judgement, and therefore the ground of a hope beyond it.\n\nExile in Babylonia was not slavery. Jews were settled in communities along the canals, could build houses, farm, trade and correspond, and some rose in imperial service. That comparative comfort raised its own problem — assimilation. It is in this period that the institutions that would carry Judaism without a temple begin to matter more: sabbath, circumcision, food laws, gathering for scripture and prayer, and the collecting and editing of Israel's writings."
    ,
    world:
      "Babylon under Nebuchadnezzar II was the greatest city in the world, with its processional way, the Ishtar gate and a ziggurat that dominated the skyline. His successors were weaker; the last king, Nabonidus, spent years at Tema in Arabia leaving his son Belshazzar in charge, and alienated the priesthood of Marduk. In 539 BC Cyrus of Persia took Babylon with little fighting. This was also the age of Aeschylus's predecessors in Greece, of the Buddha and Confucius further east, and of the Persian empire's rise to become the largest state the world had yet seen."
  },
  {
    era: "return",
    background:
      "Cyrus reversed Babylonian policy. Rather than deporting conquered peoples he returned them to their homelands and funded the restoration of their sanctuaries, expecting loyalty and prayers in return; his decree of 538 BC permitting Jews to return and rebuild fits a pattern documented on the Cyrus Cylinder. A first group went back under Sheshbazzar and Zerubbabel.\n\nWhat they returned to was a small, ruined province called Yehud, a fraction of the old kingdom, with Jerusalem largely empty and neighbouring provinces — Samaria to the north, Ammon across the Jordan, Ashdod on the coast — hostile to its restoration. Work on the temple stalled for years and was completed only in 516 BC under prodding from Haggai and Zechariah; men who remembered Solomon's building wept at the sight of it. There was no king, and there would not be one: authority lay with the high priest, with a Persian-appointed governor, and with the law.\n\nEzra arrived some decades later with a royal commission to teach and enforce the law of God, and Nehemiah around 445 BC as governor to rebuild the walls, which he did in the face of organised opposition and internal debt crisis. Both men treated intermarriage with surrounding peoples as an existential issue: a community this small, with no political power, could disappear into its neighbours within a generation. The era ends with the community defined by law, temple and separation, and with Malachi complaining that even that had gone stale."
    ,
    world:
      "The Persian empire ran from the Indus to the Aegean, governed through satrapies, linked by royal roads and a courier system, and tolerant of local religion as a matter of policy. Aramaic was its administrative language and became the everyday speech of Jews. During these same years Persia fought and lost the wars against the Greek city-states — Marathon in 490 BC, Salamis in 480 BC — and Athens entered the century of Pericles, Sophocles, Herodotus and Socrates."
  },
  {
    era: "silence",
    background:
      "No book of the Protestant Old Testament covers the roughly four centuries between Malachi and the birth of Jesus, but they are the centuries in which the world of the New Testament was made. Nothing in the Gospels — synagogues, scribes, Pharisees, Sadducees, a Sanhedrin, the expectation of a messiah who would drive out foreign rulers — can be found in the Old Testament in that form. All of it comes from this period.\n\nAlexander the Great took the Persian empire between 334 and 323 BC, and after his death his generals divided it. Judea fell first to the Ptolemies of Egypt and then, after 198 BC, to the Seleucids of Syria. Greek became the language of administration and commerce, and Greek education, dress, athletics and city institutions spread through the region — a process attractive to much of the Jerusalem aristocracy and repellent to others. It was in Egypt during this period that the Hebrew scriptures were translated into Greek, producing the Septuagint that the New Testament writers would quote.\n\nThe crisis came under Antiochus IV Epiphanes. Around 167 BC he outlawed circumcision, sabbath and the scriptures, and desecrated the temple with a pagan altar. The revolt led by the priest Mattathias and his son Judas Maccabeus recaptured and rededicated the temple in 164 BC, an event commemorated as Hanukkah, and won an independence that lasted about eighty years under the Hasmonean dynasty — priests who made themselves kings. That dynasty's corruption and infighting produced the parties of the Gospels: Sadducees drawn from the priestly aristocracy and cooperating with power, Pharisees committed to applying the law to daily life, Essenes withdrawing to the desert, and later Zealots committed to armed resistance.\n\nIn 63 BC Pompey ended the independence, entering Jerusalem and walking into the holy of holies. Rome ruled thereafter through client kings, of whom Herod the Great, appointed in 37 BC, was the most capable and the most brutal: he rebuilt the temple on a spectacular scale, built harbours, fortresses and Greek cities, and murdered members of his own family. His death in 4 BC left his kingdom divided among his sons. By then heavy taxation, an aristocracy compromised by collaboration, and a body of literature about a coming decisive intervention by God had produced a population primed for a deliverer."
    ,
    world:
      "This is the Hellenistic age and then the rise of Rome. Alexander's conquests spread a common Greek language across the eastern Mediterranean; Alexandria became the intellectual capital of the world; Stoicism and Epicureanism took shape. Rome destroyed Carthage in 146 BC, absorbed Greece and Asia Minor, tore itself apart in civil wars, and settled under Augustus after 31 BC into an empire with unprecedented reach — a single currency, suppressed piracy, an army on the roads, and a peace that made travel and correspondence across the Mediterranean possible in a way it had never been before."
  },
  {
    era: "christ",
    background:
      "Jesus was born in the last years of Herod the Great, probably between 6 and 4 BC, since the calendar later adopted was miscalculated. He grew up in Nazareth, a village of a few hundred in Galilee, a few miles from Sepphoris, a Greek-style city Herod Antipas was rebuilding, so the Greek-speaking world was near at hand even in the countryside.\n\nJudea by then was under direct Roman rule through a prefect — Pontius Pilate from AD 26 to 36 — while Galilee remained under Herod Antipas. Real power over Jewish affairs lay with the high priest and the temple aristocracy, who held office at Rome's pleasure and whose overriding concern was avoiding the kind of disturbance that brought legions. Taxation was heavy and layered: tribute to Rome, tolls collected by contractors, and temple dues. Tax collectors were despised as collaborators who profited from the arrangement.\n\nThe religious landscape was plural. Pharisees, influential in the synagogues, worked to extend priestly purity into everyday life and believed in resurrection; Sadducees, based in the temple, rejected it; Essenes had withdrawn; and armed resistance movements appeared periodically and were crushed. Messianic expectation was widespread and mostly political — a son of David who would restore the kingdom and expel the Romans. A crucified messiah was a contradiction in terms: crucifixion was Rome's punishment for slaves and rebels, designed to be public and shameful, and it announced that the victim had been defeated.\n\nJesus's public ministry lasted perhaps three years and ended in Jerusalem at Passover, when the city was crowded with pilgrims and the authorities were at their most nervous, most likely in AD 30 or 33."
    ,
    world:
      "Tiberius was emperor from AD 14 to 37. The Mediterranean was at peace under Roman administration, connected by roads and shipping, with Greek as the common language of the eastern half and Latin of the west. Jewish communities were established in most major cities and attracted Gentile sympathisers, which would shape the first generation of Christian mission. Within forty years of the crucifixion, Judea revolted, and in AD 70 Roman legions destroyed Jerusalem and the temple."
  },
  {
    era: "church",
    background:
      "The movement began in Jerusalem as a group within Judaism whose members kept the temple hours and thought of themselves as Jews who had found the messiah. Two pressures pushed it outward: persecution, which scattered believers into Judea, Samaria and Antioch, and the discovery that Gentiles were responding. That raised the question the era turned on — whether Gentiles had to be circumcised and keep the law to belong. The Jerusalem council, around AD 49, decided they did not, and the argument continued for years afterward.\n\nPaul's missionary journeys, from about AD 46 to 57, followed the Roman road and shipping network through Asia Minor, Macedonia and Greece, beginning in the synagogue in each city and moving to Gentile hearers when expelled. His letters were written into specific crises in specific congregations, most of which met in private houses of perhaps thirty or forty people, mixing slaves and owners, Jews and Gentiles, rich and poor in a way the surrounding society did not.\n\nOpposition was mostly local at first: synagogue discipline, riots stirred by threatened trades, and charges before magistrates of disturbing the peace or proclaiming another king. Under Nero, after the fire of Rome in AD 64, it became lethal in the capital, and tradition places the deaths of Peter and Paul there in the following years. The Jewish revolt of AD 66 and the destruction of the temple in AD 70 then severed the movement's remaining ties to Jerusalem and left a church that was increasingly Gentile, spread across the empire, and working out how to live under a state that expected religious conformity."
    ,
    world:
      "Claudius ruled to AD 54 and expelled Jews from Rome around AD 49 over disturbances that may have concerned Christ; Nero followed and made Christians scapegoats for the fire of AD 64; after his death in AD 68 the empire had four emperors in a year before the Flavians took over and Titus destroyed Jerusalem. Under Domitian, late in the century, the imperial cult was pressed harder in the provinces, especially in Asia. The empire's roads, shipping, common languages and large diaspora Jewish communities are the practical reason a message could move from Jerusalem to Rome within thirty years."
  },
  {
    era: "consummation",
    background:
      "Revelation was written to seven actual congregations in the Roman province of Asia, in cities whose particular circumstances the opening chapters address one by one: Ephesus with its temple of Artemis, Smyrna with a hostile synagogue and a poor church, Pergamum the provincial centre of the imperial cult, Thyatira with its trade guilds, Sardis, Philadelphia and wealthy Laodicea with its banking and its lukewarm water piped from nearby springs.\n\nThe pressure on those churches was mostly economic and social rather than a systematic imperial campaign. Civic life, trade guilds and public festivals all carried religious obligation, and refusing to honour the emperor or the city's gods marked a person as disloyal and could cost a livelihood. At least one believer, Antipas, had been killed. Some congregations were accommodating; the book's harshest words are for those.\n\nIt is written in the apocalyptic idiom that Jewish writers had used since Daniel — visions, beasts, numbers, colours, cosmic imagery — a mode that both conveyed meaning to insiders and gave cover from authorities. Its Babylon is a city on seven hills, drunk on the blood of the saints and enriched by trade with the world's merchants; the first readers knew what city that meant. Its argument is that the empire's apparent supremacy is a costume, and that the throne at the centre of things is occupied by a slaughtered Lamb.\n\nHow the visions map onto history has divided readers ever since, with major traditions reading them as describing the first century, the whole span of church history, the end of the age, or symbolic patterns not tied to a timeline. The book's own conclusion is not a timetable but a city, and God dwelling with his people."
    ,
    world:
      "Under Domitian, emperor from AD 81 to 96, provincial cities in Asia competed for the honour of hosting temples to the emperor, and loyalty to Rome was expressed in religious terms throughout public life. Trade across the Mediterranean was at its height, which is why the fall of the great city in Revelation 18 is mourned by merchants and shipmasters listing cargoes. Roman power looked permanent, and to the small congregations addressed here it was the whole visible order of the world."
  }
]

export function contextForBook(book: number): BookContext | undefined {
  return BOOK_CONTEXT.find((c) => c.book === book)
}

export function contextForEra(era: string): EraContext | undefined {
  return ERA_CONTEXT.find((c) => c.era === era)
}
