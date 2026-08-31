// Background notes on each translation in the catalogue, written to help a
// reader choose a version for a particular kind of reading or study.
// Ids match the translation ids used by bolls.life.

export interface VersionInfo {
  /** Matches the translation id used by bolls.life, e.g. "KJV", "WEB", "YLT". */
  id: string
  name: string
  year: string
  translators: string
  /** Where it sits between word-for-word and thought-for-thought. */
  approach: "formal" | "moderate" | "dynamic" | "paraphrase" | "interlinear-source"
  approachNote: string
  sourceTexts: string
  readingLevel: string
  history: string
  bestFor: string[]
  watchFor: string
}

export const VERSIONS: VersionInfo[] = [
  {
    id: "KJV",
    name: "King James Version (Authorised Version)",
    year: "1611, standardised in the 1769 Blayney edition",
    translators: "Roughly fifty English scholars in six companies at Westminster, Oxford and Cambridge",
    approach: "formal",
    approachNote:
      "Close to the wording of its Hebrew and Greek sources, but willing to vary English vocabulary for rhythm rather than keep one English word per source word.",
    sourceTexts:
      "The Hebrew Masoretic Text (Bomberg rabbinic Bible), the Greek Textus Receptus in the editions of Beza and Stephanus, with reference to the Vulgate and earlier English versions.",
    readingLevel: "Demanding — early modern vocabulary, inverted syntax, and words whose meaning has since shifted.",
    history:
      "James I authorised a new translation at the Hampton Court Conference in 1604, largely to settle the friction between the bishops' church and the Puritans, whose Geneva Bible carried marginal notes the king considered seditious. The translators worked from the Bishops' Bible as their base text under fifteen rules that forbade explanatory notes, and leaned heavily on Tyndale's earlier wording. It was slow to displace the Geneva Bible but held near-total dominance in English-speaking Protestantism for three centuries, and its cadences shaped English prose far beyond the church.",
    bestFor: ["Memorisation", "Public reading", "Following older commentaries and hymns", "Concordance work with Strong's numbers"],
    watchFor:
      "Its Greek base rests on printed editions made from a small number of late medieval manuscripts, before nearly all the papyrus and uncial discoveries of the last two centuries. Words like \"conversation\" (conduct), \"prevent\" (go before) and \"charity\" (love) now mislead a modern reader who does not check them."
  },
  {
    id: "KJVA",
    name: "King James Version with Apocrypha",
    year: "1611 text including the Apocrypha, later editions",
    translators: "The same King James companies; the Apocrypha was assigned to a Cambridge company",
    approach: "formal",
    approachNote: "Identical in method to the King James Version; the difference is scope, not translation philosophy.",
    sourceTexts:
      "As the KJV, with the Apocrypha rendered chiefly from the Greek Septuagint and, for a few books, the Latin.",
    readingLevel: "Demanding — the same early modern English as the KJV.",
    history:
      "The 1611 Bible contained the Apocrypha, printed between the Testaments, because the Church of England read those books for instruction in life and manners while not treating them as a basis for doctrine. From the early nineteenth century the British and Foreign Bible Society refused to fund editions containing them, and Protestant printings quietly dropped the section. Editions that keep it restore what the original translators actually produced.",
    bestFor: ["Reading the 1611 Bible in its original scope", "Second Temple background", "Following patristic and liturgical citations"],
    watchFor:
      "Protestant, Catholic and Orthodox traditions disagree about the authority and even the contents of these books, so inclusion here is historical rather than a canonical claim. The Apocrypha received noticeably less scholarly attention from the 1611 companies than the canonical books."
  },
  {
    id: "GENEVA",
    name: "Geneva Bible",
    year: "1560, with a revised New Testament in 1576",
    translators: "English Protestant exiles in Geneva, led by William Whittingham with Anthony Gilby and Thomas Sampson",
    approach: "formal",
    approachNote: "Careful, fairly literal rendering from the original languages, with a readable English register for its day.",
    sourceTexts: "Hebrew Masoretic Text and Greek printed editions in the Textus Receptus tradition, checked against Beza's Latin.",
    readingLevel: "Demanding — sixteenth-century English, though often plainer than the KJV.",
    history:
      "Marian exiles who fled England after 1553 produced it in Calvin's Geneva, drawing on Tyndale and Coverdale. It was the first English Bible with numbered verses throughout, roman type and extensive cross-references, and the first study Bible in English: its margins carried thousands of interpretive notes from a Reformed standpoint. It was the Bible of Shakespeare, the Puritans and the Mayflower passengers, and it was precisely those notes that prompted James I to commission a replacement.",
    bestFor: ["Reformation history", "Understanding the KJV's ancestry", "Seeing an early study-Bible apparatus"],
    watchFor:
      "Its marginal notes are frankly partisan and were meant to be; treat them as a sixteenth-century commentary, not neutral background. Digital editions vary in whether they modernise spelling, and the notes are often omitted entirely."
  },
  {
    id: "TYNDALE",
    name: "Tyndale Bible",
    year: "New Testament 1526, revised 1534; Pentateuch 1530",
    translators: "William Tyndale, working alone in exile",
    approach: "formal",
    approachNote: "Direct translation from Greek and Hebrew into deliberately plain English, shaped for the ear.",
    sourceTexts: "Erasmus's printed Greek New Testament and the Hebrew Masoretic Text, with Luther's German and the Vulgate consulted.",
    readingLevel: "Demanding — the earliest layer of printed English scripture, with unfamiliar spelling.",
    history:
      "Tyndale wanted an English Bible a ploughboy could understand and could not get permission to make one in England, so he worked in Germany and the Low Countries while copies were smuggled home and burned. He coined or fixed a great deal of English religious vocabulary and chose renderings such as \"congregation\", \"elder\" and \"love\" that carried Reformation weight and drew official fury. Betrayed near Antwerp, he was strangled and burned in 1536; large portions of his wording passed almost unchanged into the Great Bible, the Geneva Bible and then the KJV.",
    bestFor: ["Tracing where familiar English phrasing came from", "Reformation study", "Short devotional reading of the Gospels"],
    watchFor:
      "Tyndale never finished the Old Testament, so no complete Bible bears his name and digital editions differ in what they include. The archaic orthography makes it hard going, and its Greek base is Erasmus's early text."
  },
  {
    id: "DRB",
    name: "Douay-Rheims Bible (Challoner revision)",
    year: "New Testament 1582, Old Testament 1609-1610; revised by Richard Challoner 1749-1752",
    translators: "English Catholic exiles at Douai and Rheims, chiefly Gregory Martin; later revised by Bishop Richard Challoner",
    approach: "formal",
    approachNote: "Extremely close to its Latin source, sometimes transliterating Latin words rather than finding English ones.",
    sourceTexts: "The Latin Vulgate, in the Clementine edition, with the Greek and Hebrew consulted.",
    readingLevel: "Demanding — Latinate vocabulary and long sentences.",
    history:
      "English Catholics in exile answered the Protestant vernacular Bibles with one of their own, produced at the college at Douai and, during its move, at Rheims. Because the Council of Trent had declared the Vulgate authentic for public use, the translators worked from Latin rather than the original languages. Challoner's eighteenth-century revision smoothed the English considerably and brought it closer to KJV diction; that revision, not the 1582-1610 original, is what almost all modern printings contain.",
    bestFor: ["Catholic tradition and liturgy", "Comparing readings that follow the Vulgate", "Study of the deuterocanonical books"],
    watchFor:
      "It is a translation of a translation: where the Vulgate itself misread or interpreted the Hebrew or Greek, the English inherits it. Editions labelled \"Douay-Rheims\" are usually Challoner's, which differs substantially from the original text of that name."
  },
  {
    id: "WBT",
    name: "Webster's Revision of the King James Bible",
    year: "1833",
    translators: "Noah Webster, the American lexicographer, working alone",
    approach: "formal",
    approachNote: "The KJV with obsolete and (to Webster) indelicate words replaced; the underlying translation is unchanged.",
    sourceTexts: "The same as the KJV — no fresh work on the Hebrew or Greek.",
    readingLevel: "Moderate to demanding — early modern syntax with somewhat updated vocabulary.",
    history:
      "Webster, fresh from his American Dictionary, thought the KJV's language had drifted far enough to obscure the sense for ordinary readers and offend them in places. He corrected grammar he judged faulty, replaced words that had changed meaning, and softened expressions he considered coarse for family reading. It never displaced the KJV in American churches but stands as an early, conservative attempt at revision by a single hand.",
    bestFor: ["A gentler on-ramp to KJV English", "Comparing how word meanings shifted by 1833", "American religious history"],
    watchFor:
      "It inherits every textual limitation of the KJV, since Webster revised the English rather than the sources. Some of his changes reflect nineteenth-century taste rather than the meaning of the original."
  },
  {
    id: "YLT",
    name: "Young's Literal Translation",
    year: "1862, revised 1887 and 1898",
    translators: "Robert Young, a self-taught Scottish publisher and compiler of the analytical concordance",
    approach: "formal",
    approachNote: "The most rigidly word-for-word English Bible in common use, holding Hebrew and Greek tense and word order even where English breaks.",
    sourceTexts: "Hebrew Masoretic Text and the Greek Textus Receptus.",
    readingLevel: "Demanding — grammatical rather than archaic difficulty; often reads like a gloss.",
    history:
      "Young argued that translators had smoothed away features of the originals that mattered, above all the Hebrew verb system, and he set out to reproduce them mechanically. He rendered Hebrew perfects as English past and imperfects as present, which produces the version's characteristic uneven tenses, and he refused to supply idiomatic English where the source had none. The result was never intended as a pulpit Bible; Young offered it as a tool to be laid alongside a normal translation.",
    bestFor: ["Seeing the underlying word order", "Verb and tense study without Hebrew or Greek", "Checking another version's paraphrase"],
    watchFor:
      "It is close to unreadable aloud and frequently misleading as English idiom, since the literalness reproduces form at the cost of sense. Its tense scheme reflects a nineteenth-century theory of Hebrew that later grammarians largely abandoned."
  },
  {
    id: "DBY",
    name: "Darby Translation",
    year: "New Testament 1867; Old Testament completed after his death, 1890",
    translators: "John Nelson Darby, with associates who completed and edited the work",
    approach: "formal",
    approachNote: "Literal and technically precise, with heavy footnoting of textual and grammatical alternatives.",
    sourceTexts:
      "Early critical Greek editions, notably Tischendorf and Tregelles, drawing on Sinaiticus and Vaticanus; the Hebrew Masoretic Text for the Old Testament.",
    readingLevel: "Demanding — stiff English and long, qualified sentences.",
    history:
      "Darby, a former Church of Ireland curate and a founder of the Plymouth Brethren, made his translations chiefly for study among assemblies that read scripture without clergy. He also produced German and French versions, and his English New Testament was among the first to make serious use of the newly available fourth-century codices, well before the Revised Version. His dispensational theology shaped the notes more than the text, but the translation remains valued by readers who want a literal rendering with the textual evidence exposed.",
    bestFor: ["Textual comparison with the KJV", "Detailed word study", "Seeing early critical-text readings in English"],
    watchFor:
      "The prose is awkward by design and poorly suited to public or devotional reading. Renderings and notes at times carry Brethren distinctives, so it is worth cross-checking interpretive choices."
  },
  {
    id: "RV1885",
    name: "English Revised Version",
    year: "New Testament 1881, Old Testament 1885, Apocrypha 1894",
    translators: "A committee of British scholars convened by the Convocation of Canterbury, with an American cooperating committee",
    approach: "formal",
    approachNote: "A revision of the KJV constrained to change the English only where fidelity or clarity demanded it.",
    sourceTexts:
      "A newly weighed Greek text drawing on Sinaiticus and Vaticanus, shaped by the work of Westcott and Hort; the Masoretic Text for the Old Testament.",
    readingLevel: "Demanding — KJV cadence with more exact but stiffer wording.",
    history:
      "By the 1870s the manuscript discoveries of the century, especially Tischendorf's find of Codex Sinaiticus at Saint Catherine's monastery, made a revision of the KJV's Greek base hard to resist. The revisers omitted or bracketed passages such as the longer ending of Mark, the woman taken in adultery and the Johannine Comma, and the New Testament caused a public storm; Dean Burgon attacked the underlying text in print and the argument over Byzantine versus Alexandrian manuscripts dates from this moment. The version sold enormously at first and then faded in the churches, but it set the pattern every later English revision has followed.",
    bestFor: ["Seeing the textual debate at its origin", "Careful comparison against the KJV", "Study rather than reading aloud"],
    watchFor:
      "The revisers' commitment to consistency produced English that even sympathetic reviewers called wooden. Whether its textual decisions were right is still genuinely contested: critical editions rest on older but fewer manuscripts, the Byzantine tradition on far more but later ones, and the differences affect wording much more than doctrine."
  },
  {
    id: "ASV",
    name: "American Standard Version",
    year: "1901",
    translators: "The American committee that had cooperated on the English Revised Version, chaired by Philip Schaff",
    approach: "formal",
    approachNote: "Strict formal equivalence, preferring a fixed English word for each Hebrew or Greek word wherever possible.",
    sourceTexts: "Essentially the Revised Version's critical Greek text and the Masoretic Hebrew.",
    readingLevel: "Demanding — precise but flat, with heavy subordinate clauses.",
    history:
      "The Americans had agreed to hold their preferences in an appendix for fourteen years after the Revised Version appeared; when the term expired they issued their own edition incorporating them. The most visible change was printing the divine name as \"Jehovah\" throughout the Old Testament instead of \"the LORD\". It became the standard study Bible of American seminaries in the first half of the twentieth century and is the direct ancestor of the RSV, the NASB and the ESV.",
    bestFor: ["Word study and cross-referencing", "Grammatical analysis", "A literal check on freer translations"],
    watchFor:
      "It is famously wooden; its own preface conceded the English was not meant to be graceful. \"Jehovah\" is a hybrid form that no ancient reader used, and modern scholarship generally reconstructs the name differently."
  },
  {
    id: "JPS",
    name: "Jewish Publication Society Bible (1917)",
    year: "1917",
    translators: "A board of Jewish scholars in America chaired by Max Margolis",
    approach: "formal",
    approachNote: "Close to the Hebrew, in dignified English modelled on the Revised Version's register.",
    sourceTexts: "The Masoretic Text, following the traditional Jewish text and versification, with Jewish exegetical tradition consulted throughout.",
    readingLevel: "Moderate to demanding — biblical English of the early twentieth century.",
    history:
      "American Jewish communities had been reading Christian English Bibles or unsatisfactory earlier attempts, and the Society set out to give English-speaking Jews a version made by their own scholars. Margolis's board worked from the Revised Version as a base but corrected it wherever Jewish reading of the Hebrew, or Jewish tradition, pointed elsewhere, notably in contested messianic passages such as Isaiah 7:14. It served as the standard English Tanakh for decades until the wholly fresh JPS translation of 1962-1985 replaced it.",
    bestFor: ["Reading the Hebrew Bible in Jewish book order", "Comparing Jewish and Christian renderings", "Old Testament study"],
    watchFor:
      "It contains no New Testament and follows Jewish chapter and verse divisions, which differ from Christian ones in places. Its English is a century old and its scholarship predates the Dead Sea Scrolls."
  },
  {
    id: "BRENTON",
    name: "Brenton's English Translation of the Septuagint",
    year: "1844, with the Greek text and English in parallel",
    translators: "Sir Lancelot Charles Lee Brenton",
    approach: "formal",
    approachNote: "A literal English rendering of the Greek Old Testament, not of the Hebrew behind it.",
    sourceTexts: "The Septuagint as printed in the Vaticanus-based Greek editions of the day.",
    readingLevel: "Demanding — KJV-style English applied to often difficult Greek.",
    history:
      "The Septuagint, translated by Jewish scholars in Alexandria from roughly the third to the first century BC, was the Old Testament of the early church and the version most often quoted in the New Testament. Brenton produced the first widely available English rendering so that English readers could see where it differs from the Hebrew — and the differences are substantial, particularly in Jeremiah, Job and the Psalm numbering. It remains the standard English Septuagint for general readers, alongside the more recent scholarly NETS.",
    bestFor: ["Tracing New Testament quotations of the Old", "Textual comparison with the Masoretic Text", "Orthodox tradition, which reads the Septuagint as its Old Testament"],
    watchFor:
      "This is a translation of a translation, so it shows what Greek-speaking Jews read, not directly what the Hebrew said. Brenton's base Greek predates the modern critical editions of the Septuagint, and his English is nearly two centuries old."
  },
  {
    id: "WEB",
    name: "World English Bible",
    year: "Begun 1997; New Testament and Old Testament complete, still lightly maintained",
    translators: "Michael Paul Johnson with volunteer editors, working from the ASV",
    approach: "moderate",
    approachNote: "Literal in the ASV line, but with archaic pronouns and syntax modernised so it reads as contemporary English.",
    sourceTexts:
      "The ASV's base, updated: the Biblia Hebraica Stuttgartensia for the Old Testament and the Majority Text for the New, with critical readings noted.",
    readingLevel: "Easy to moderate — plain modern English.",
    history:
      "The 1901 ASV had passed into the public domain, and the project set out to bring it into modern English and release the result with no copyright at all, so it could be freely printed, quoted and embedded in software. Work has proceeded by volunteer revision rather than committee, with the text updated continuously rather than issued in fixed editions. It is now the default modern English text in a great many Bible apps and offline datasets, largely because it costs nothing to distribute.",
    bestFor: ["Everyday reading", "Sharing and quoting without permissions", "A modern text to pair with the KJV"],
    watchFor:
      "It has had nothing like the scholarly review a major commercial translation receives, and the text can change between downloads. Its New Testament follows the Majority Text, so it differs from most modern translations at points where the critical editions are shorter."
  },
  {
    id: "NHEB",
    name: "New Heart English Bible",
    year: "2008 onward, revised periodically",
    translators: "Wayne Mitchell and collaborators, revising the World English Bible",
    approach: "moderate",
    approachNote: "Modern, fairly literal English in the ASV tradition, edited for smoother sentences than the WEB.",
    sourceTexts: "Critical Greek editions for the New Testament and the Masoretic Text for the Old; several editions differ in how the divine name is rendered.",
    readingLevel: "Easy to moderate — contemporary English.",
    history:
      "It is a public-domain descendant of the same ASV line as the WEB, produced to smooth the remaining stiffness and to follow the critical Greek text more closely than the WEB's Majority Text base. Variant editions circulate — with \"Jehovah\", with \"YHWH\", or with \"the LORD\" — because the licence permits anyone to adapt it. It is common in free Bible software for the same reason as the WEB.",
    bestFor: ["Free modern reading text", "Comparison against the WEB's Majority Text choices", "Embedding in software"],
    watchFor:
      "Editorial oversight is thin and versions circulating under this name are not identical, so check which edition you have. It has no institutional review board standing behind its renderings."
  },
  {
    id: "LSV",
    name: "Literal Standard Version",
    year: "2020",
    translators: "A small team publishing through Covenant Press",
    approach: "formal",
    approachNote: "Very literal, marking added words and keeping a consistent English equivalent for each source word.",
    sourceTexts: "The Masoretic Text with Dead Sea Scroll and Septuagint readings noted; a Greek text weighing both critical and Byzantine evidence.",
    readingLevel: "Moderate to demanding — modern vocabulary in deliberately literal constructions.",
    history:
      "It began as a thorough modernisation of Young's Literal Translation and grew into a fresh literal translation in its own right. It keeps unusual conventions: no capitalised pronouns for deity, transliteration of the divine name as \"YHWH\", justified text without verse-per-line formatting, and caesura marks in the poetry to show Hebrew line breaks. It was released into the public domain, which is why it appears in free Bible software despite being recent.",
    bestFor: ["Literal study in modern vocabulary", "Reading Hebrew poetry with its line structure visible", "An alternative to YLT"],
    watchFor:
      "It is the work of a small group without wide scholarly review, and it is new enough that little independent assessment exists. Its formatting conventions take getting used to, and the literalness still costs readability."
  },
  {
    id: "BSB",
    name: "Berean Standard Bible",
    year: "2016-2022, with ongoing revision",
    translators: "A committee assembled by Bible Hub, working from an interlinear base",
    approach: "moderate",
    approachNote: "Aims to be as literal as clarity allows, with idiomatic English where a word-for-word rendering would obscure the sense.",
    sourceTexts:
      "The Biblia Hebraica Stuttgartensia with Dead Sea Scroll and Septuagint evidence; for the New Testament, a Greek text weighing the Nestle-Aland, Textus Receptus and Byzantine traditions.",
    readingLevel: "Easy to moderate — clear contemporary English.",
    history:
      "Bible Hub built the translation outward from its own Greek and Hebrew interlinear work, first publishing a literal interlinear layer and then the readable Standard text on top of it. It was released for free use, including commercial printing, deliberately filling the gap between the dated public-domain versions and the tightly licensed modern ones. Its verse-by-verse alignment with the interlinear data is the reason it appears in so many study tools.",
    bestFor: ["Modern reading with study depth", "Pairing English with the underlying Greek and Hebrew", "Free distribution"],
    watchFor:
      "It is young, still being revised, and lacks the long track record of the established committee translations. Its New Testament text-critical decisions are its own blend rather than a standard published edition, so it will not always match either a critical or a Byzantine text."
  },
  {
    id: "WLC",
    name: "Westminster Leningrad Codex",
    year: "Manuscript completed circa 1008-1010 AD; this digital edition from the 1980s onward",
    translators: "Not a translation — a Hebrew source text; the digital edition prepared by the J. Alan Groves Center",
    approach: "interlinear-source",
    approachNote: "The Hebrew Old Testament itself, with vowel points and cantillation marks, not rendered into any other language.",
    sourceTexts: "Codex Leningradensis B19a, the oldest complete manuscript of the Hebrew Bible.",
    readingLevel: "Requires Hebrew; useful without it only alongside Strong's numbers or an interlinear.",
    history:
      "The consonantal Hebrew text was preserved and then furnished with vowels, accents and marginal notes by the Masoretes, families of Jewish scribes working chiefly at Tiberias from roughly the seventh to the tenth century; the ben Asher family produced the most authoritative form. The Leningrad Codex was copied in Cairo around 1008 from ben Asher exemplars and is the base text of the Biblia Hebraica Stuttgartensia, so nearly every modern Old Testament translation stands on it. The Dead Sea Scrolls, a thousand years older, confirmed how carefully this text had been transmitted while also showing that other Hebrew textual traditions existed.",
    bestFor: ["Hebrew reading", "Word study with Strong's numbers", "Checking how a translation handled a specific Hebrew word"],
    watchFor:
      "It is Hebrew, so on its own it is unusable without the language or an interlinear tool. It represents one text tradition, and the scrolls and the Septuagint occasionally point to different readings."
  },
  {
    id: "TR",
    name: "Textus Receptus (Greek New Testament)",
    year: "1516-1633; the Elzevir and Stephanus editions are the usual reference points",
    translators: "Not a translation — a printed Greek text edited by Erasmus, then Stephanus, Beza and the Elzevirs",
    approach: "interlinear-source",
    approachNote: "The Greek New Testament in the printed form that underlies the Reformation-era translations.",
    sourceTexts: "A small group of late Byzantine minuscule manuscripts, with a few readings supplied from the Latin Vulgate.",
    readingLevel: "Requires Greek; usable without it only through Strong's numbers or an interlinear.",
    history:
      "Erasmus rushed his Greek New Testament into print in 1516 to beat a rival Spanish edition, working from perhaps half a dozen manuscripts available at Basel, none of them early, and back-translating from the Latin where his Greek copy of Revelation was defective. Stephanus, Beza and the Elzevir brothers refined it over the next century; a publisher's blurb in the 1633 Elzevir edition — textum receptum, \"the received text\" — gave it its name. It became the base of Luther's German Bible, Tyndale, the Geneva Bible and the KJV, and so shaped Protestant scripture for three hundred years.",
    bestFor: ["Reading the Greek behind the KJV and Geneva Bible", "Strong's number lookups keyed to those translations", "Studying where translations differ textually"],
    watchFor:
      "It rests on a handful of late manuscripts and includes a few readings with very little Greek support, the Johannine Comma at 1 John 5:7 being the clearest case. Modern critical editions weigh far older evidence, though defenders of the Byzantine tradition reply that the older manuscripts are few and geographically narrow while the later ones are numerous and agree closely — the disagreement is real, and it affects wording much more than it affects doctrine."
  }
]

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Look up a version by catalogue id, falling back to its full name.
 *
 * Some ids here are our best guess at what bolls.life calls a version, so an
 * exact id miss is expected; matching the name as well means a description
 * still finds its translation when the id guess is wrong.
 */
export function versionInfoByName(id: string, fullName?: string): VersionInfo | undefined {
  const direct = versionInfo(id)
  if (direct) return direct
  if (!fullName) return undefined
  const target = norm(fullName)
  return VERSIONS.find(v => {
    const n = norm(v.name)
    return n === target || target.includes(n) || n.includes(target)
  })
}

export function versionInfo(id: string): VersionInfo | undefined {
  return VERSIONS.find(v => v.id === id)
}
