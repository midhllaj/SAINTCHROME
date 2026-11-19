/**
 * THE RELICS — the single source of truth for products.
 *
 *  price      → placeholder numbers, in CONFIG.currency (₹). // TODO: set real prices
 *  model      → key in src/models/index.js (the 3D model)
 *  accent     → glow colour behind the relic in its viewer
 *  hotspots   → text for the glowing ✦ annotations (ids come from the model file)
 *  materials  → shown on the product page. // TODO: confirm real materials with your supplier
 *  reference  → your original photos (public/reference), used only by the dev model lab
 */

export const RITES = [
  { slug: 'bracelets', name: 'Bracelets', latin: 'Brachium', blurb: 'Chains for the wrist that never kneels.' },
  { slug: 'necklaces', name: 'Necklaces', latin: 'Collum', blurb: 'Worn over the heart. Heavier than they look.' },
  { slug: 'eyewear', name: 'Eyewear', latin: 'Oculus', blurb: 'See the world through stained glass.' },
  { slug: 'earphones', name: 'Earphones', latin: 'Auris', blurb: 'A private choir, wired in chrome.' },
];

export const PRODUCTS = [
  {
    slug: 'thorn-relic',
    number: '001',
    name: 'Thorn Relic',
    rite: 'bracelets',
    price: 2799, // TODO
    model: 'thornRelic',
    accent: '#9fb3c8',
    brand: 'SAINTCHROME',
    tagline: 'Five thorns. One crown, broken and worn on the wrist.',
    description:
      'Forged for the saint who bites back. A heavy diamond-cut cable strand carries five polished thorns, each one a needle of liquid light. Beside it runs a fine curb chain, quiet as a whispered vow. It catches every flame in the room and gives none of them back.',
    materials: ['Mirror-polished silver-tone metal', 'Diamond-cut cable strand + fine curb strand', 'Five cone spikes on jump-ring bails'], // TODO confirm
    details: ['Two strands', 'Lobster clasp with extender chain', 'Oval maker\'s tag', 'Adjustable fit'],
    hotspots: {
      spike: { title: 'The Thorns', text: 'Five polished cones, each hung on its own bail so they swing and catch light as you move.' },
      chain: { title: 'Cable Strand', text: 'Chunky diamond-cut links. The flat facets flash like struck metal.' },
      fine: { title: 'Curb Strand', text: 'A fine twisted curb chain that softens the weight of the thorns.' },
      clasp: { title: 'Lobster Clasp', text: 'A spring lobster clasp with an extender chain, so it sits right on any wrist.' },
    },
    reference: ['bracelets/6970.jpg', 'bracelets/6971.jpg', 'bracelets/6972.jpg'],
  },
  {
    slug: 'blood-saint',
    number: '002',
    name: 'Blood Saint',
    rite: 'bracelets',
    price: 3199, // TODO
    model: 'bloodSaint',
    accent: '#B3001B',
    glow: '#B3001B',
    brand: 'SAINTCHROME',
    tagline: 'A drop of martyr\'s red, held in molten silver.',
    description:
      'The first relic. A faceted blood-red crystal, caught mid-fall and gripped by vines of molten silver. A flat Cuban strand and a fine curb chain meet at the stone. A four-point star with a red heart hangs below it like a vow you can\'t take back.',
    materials: ['Mirror-polished silver-tone metal', 'Faceted blood-red crystal', 'Star charm with red stone'], // TODO confirm
    details: ['Flat Cuban strand + fine curb strand', 'Liquid-silver vine setting', 'Lobster clasp with extender chain', 'Oval maker\'s tag'],
    hotspots: {
      crystal: { title: 'The Blood Crystal', text: 'A step-cut red crystal. Hold it to the light and it glows like a stained-glass rose window.' },
      vines: { title: 'Liquid Vines', text: 'Molten silver poured around the stone. Organic, uneven, and nothing like any other setting.' },
      pave: { title: 'The Pavé Back', text: 'Turn it over: the back of the setting is chrome set edge to edge with tiny glittering stones, with molten points along its edges.' },
      star: { title: 'Star of the Saint', text: 'A four-point star, the mark of SAINTCHROME, with a single red stone at its heart.' },
      chain: { title: 'Twin Strands', text: 'A flat diamond-cut Cuban chain beside a fine curb chain. Heavy and light, sinner and saint.' },
      clasp: { title: 'Lobster Clasp', text: 'A spring lobster clasp with an extender chain and an oval tag.' },
    },
    reference: ['bracelets/6967.jpg', 'bracelets/6966.jpg', 'bracelets/6968.jpg'],
  },
  {
    slug: 'obsidian-saint',
    number: '003',
    name: 'Obsidian Saint',
    rite: 'bracelets',
    price: 3199, // TODO
    model: 'obsidianSaint',
    accent: '#8c95a3',
    brand: 'SAINTCHROME',
    tagline: 'The saint who walked through the night and kept it.',
    description:
      'Blood Saint\'s twin, sworn to darkness. A black crystal swallows the light while the liquid silver around it throws it back twice as bright. A plain silver star hangs from it, unjewelled, for those who need no colour to be seen.',
    materials: ['Mirror-polished silver-tone metal', 'Faceted black crystal', 'Plain silver star charm'], // TODO confirm
    details: ['Flat Cuban strand + fine curb strand', 'Liquid-silver vine setting', 'Lobster clasp with extender chain', 'Oval maker\'s tag'],
    hotspots: {
      crystal: { title: 'Obsidian Crystal', text: 'A step-cut black crystal, glossy as a cathedral floor at midnight.' },
      vines: { title: 'Liquid Vines', text: 'Molten silver poured around the stone, catching every highlight the crystal refuses.' },
      pave: { title: 'The Pavé Back', text: 'Turn it over: chrome set edge to edge with tiny glittering stones, the only light this relic lets you keep.' },
      star: { title: 'Bare Star', text: 'The four-point star in polished silver alone. No stone. No apology.' },
      chain: { title: 'Twin Strands', text: 'A flat diamond-cut Cuban chain beside a fine curb chain.' },
      clasp: { title: 'Lobster Clasp', text: 'A spring lobster clasp with an extender chain and an oval tag.' },
    },
    reference: ['bracelets/6976.jpg', 'bracelets/6974.jpg', 'bracelets/6975.jpg'],
  },
  {
    slug: 'verdant-saint',
    number: '004',
    name: 'Verdant Saint',
    rite: 'bracelets',
    price: 3199, // TODO
    model: 'verdantSaint',
    accent: '#0F8A3C',
    glow: '#0F8A3C',
    brand: 'SAINTCHROME',
    tagline: 'Grown from the garden behind the altar.',
    description:
      'A deep emerald crystal wrapped in silver vines, as if the chapel garden grew straight into the metal. Long oval cable links, with a shadow chain of black woven through them. A star with a green heart hangs at the side.',
    materials: ['Mirror-polished silver-tone metal', 'Black-plated woven chain', 'Faceted emerald-green crystal'], // TODO confirm
    details: ['Oval cable chain with woven black chain', 'Liquid-silver vine setting', 'Star charm with green stone', 'Lobster clasp with extender chain'],
    hotspots: {
      crystal: { title: 'Verdant Crystal', text: 'Step-cut emerald green. Under light it turns the colour of moss on old stone.' },
      vines: { title: 'Liquid Vines', text: 'Silver poured like sap, wrapping the crystal in two molten tendrils.' },
      pave: { title: 'The Pavé Back', text: 'Turn it over: the back of the setting is chrome set edge to edge with tiny glittering stones.' },
      star: { title: 'Star of the Saint', text: 'The four-point star with a single green stone set at its centre.' },
      chain: { title: 'Cable & Shadow', text: 'Long oval cable links with a fine black chain woven through them like a shadow.' },
      clasp: { title: 'Lobster Clasp', text: 'A spring lobster clasp with an extender chain and an oval tag.' },
    },
    reference: ['bracelets/6964.jpg', 'bracelets/6963.jpg', 'bracelets/6965.jpg'],
  },
  {
    slug: 'rosary-of-ash',
    number: '005',
    name: 'Rosary of Ash',
    rite: 'necklaces',
    price: 3499, // TODO
    model: 'rosaryOfAsh',
    accent: '#7f9a8f',
    brand: 'SAINTCHROME',
    tagline: 'Prayers counted in stone, sealed with a budded cross.',
    description:
      'A rosary for a quieter kind of faith. Long paperclip links are joined by pairs of small round rings. Faceted agate in grey, teal, moss and rose is counted out between mirror rondelles: one run starts right at the cross, the other waits three links up the opposite side. Where the sides meet hangs a cast cross with budded ends, a running vine and a rosette at its heart.',
    materials: ['Silver-tone metal chain and cross', 'Faceted agate beads', 'Polished spacer rondelles'], // TODO confirm
    details: ['Paperclip chain with double round rings', 'Two six-stone runs of faceted agate, one on each side', 'Budded cross pendant with rosette', 'Lobster clasp, extender chain and tag'],
    hotspots: {
      cross: { title: 'The Budded Cross', text: 'Each arm ends in a three-lobed bud. A raised vine runs down every arm, and a four-petal rosette with a round boss sits at the centre.' },
      beads: { title: 'Agate Stones', text: 'Two runs of six faceted agate rounds in mixed colours, one on each side of the cross, with a mirror rondelle between every stone.' },
      chain: { title: 'Paperclip Chain', text: 'Long open links joined by pairs of small round rings. Light and architectural.' },
      clasp: { title: 'Lobster Clasp', text: 'A spring lobster clasp with an extender chain and a rectangular tag.' },
    },
    reference: ['necklaces/6953.jpg', 'necklaces/6952.jpg', 'necklaces/6955.jpg'],
  },
  {
    slug: 'azure-saint',
    number: '006',
    name: 'Azure Saint',
    rite: 'necklaces',
    price: 3699, // TODO
    model: 'azureSaint',
    accent: '#2a4bd6',
    glow: '#2a4bd6',
    brand: 'SAINTCHROME',
    tagline: 'A piece of the night sky, worn over the heart.',
    description:
      'The Saint family, raised to the throat. A cobalt crystal bar sits at the centre of the collar, held in liquid-silver vines. A black chain winds through the cable links like a vein of night. Its star carries a blue stone, the colour of the hour before dawn.',
    materials: ['Mirror-polished silver-tone metal', 'Black-plated woven chain', 'Faceted cobalt-blue crystal'], // TODO confirm
    details: ['Oval cable chain with woven black chain', 'Liquid-silver vine setting', 'Star charm with blue stone', 'Lobster clasp with extender chain'],
    hotspots: {
      crystal: { title: 'Azure Crystal', text: 'Step-cut cobalt. Deep enough to fall into.' },
      pave: { title: 'The Pavé Back', text: 'Turn it over: the back of the setting is chrome set edge to edge with tiny glittering stones, with molten points along its edges.' },
      star: { title: 'Star of the Saint', text: 'The four-point star set with a single blue stone.' },
      chain: { title: 'Woven Shadow', text: 'Oval cable links with a fine black chain woven through them.' },
      clasp: { title: 'Lobster Clasp', text: 'A spring lobster clasp with an extender chain and an oval tag.' },
    },
    reference: ['necklaces/6958.jpg', 'necklaces/6956.jpg', 'necklaces/6957.jpg'],
  },
  {
    slug: 'crimson-saint',
    number: '012',
    name: 'Crimson Saint',
    rite: 'necklaces',
    price: 3699, // TODO
    model: 'crimsonSaint',
    accent: '#B3001B',
    glow: '#B3001B',
    brand: 'SAINTCHROME',
    tagline: 'A drop of martyr’s red, worn at the throat.',
    description:
      'Azure Saint’s blood sister. A red crystal bar sits at the centre of the collar, held in liquid-silver vines. A black chain winds through the cable links like a vein of night. Its star carries a red stone, lit like a votive candle.',
    materials: ['Mirror-polished silver-tone metal', 'Black-plated woven chain', 'Faceted blood-red crystal'], // TODO confirm
    details: ['Oval cable chain with woven black chain', 'Liquid-silver vine setting', 'Star charm with red stone', 'Lobster clasp with extender chain'],
    hotspots: {
      crystal: { title: 'Crimson Crystal', text: 'Step-cut red. Hold it to the light and it glows like a rose window.' },
      pave: { title: 'The Pavé Back', text: 'Turn it over: the back of the setting is chrome set edge to edge with tiny glittering stones, with molten points along its edges.' },
      star: { title: 'Star of the Saint', text: 'The four-point star set with a single red stone.' },
      chain: { title: 'Woven Shadow', text: 'Oval cable links with a fine black chain woven through them.' },
      clasp: { title: 'Lobster Clasp', text: 'A spring lobster clasp with an extender chain and an oval tag.' },
    },
    reference: ['necklaces/6958.jpg', 'necklaces/6956.jpg', 'necklaces/6957.jpg'], // same necklace as Azure Saint, other stone
  },
  {
    slug: 'onyx-saint',
    number: '013',
    name: 'Onyx Saint',
    rite: 'necklaces',
    price: 3699, // TODO
    model: 'onyxSaint',
    accent: '#8c95a3',
    brand: 'SAINTCHROME',
    tagline: 'The night itself, hung over the heart.',
    description:
      'The Saint collar sworn to darkness. A black crystal swallows the light while the liquid silver around it throws it back twice as bright. A black chain winds through the cable links, and a plain silver star hangs beside it, unjewelled.',
    materials: ['Mirror-polished silver-tone metal', 'Black-plated woven chain', 'Faceted black crystal'], // TODO confirm
    details: ['Oval cable chain with woven black chain', 'Liquid-silver vine setting', 'Plain silver star charm', 'Lobster clasp with extender chain'],
    hotspots: {
      crystal: { title: 'Onyx Crystal', text: 'A step-cut black crystal, glossy as a cathedral floor at midnight.' },
      pave: { title: 'The Pavé Back', text: 'Turn it over: the back of the setting is chrome set edge to edge with tiny glittering stones, with molten points along its edges.' },
      star: { title: 'Bare Star', text: 'The four-point star in polished silver alone. No stone. No apology.' },
      chain: { title: 'Woven Shadow', text: 'Oval cable links with a fine black chain woven through them.' },
      clasp: { title: 'Lobster Clasp', text: 'A spring lobster clasp with an extender chain and an oval tag.' },
    },
    reference: ['necklaces/6958.jpg', 'necklaces/6956.jpg', 'necklaces/6957.jpg'], // same necklace as Azure Saint, other stone
  },
  {
    slug: 'jade-saint',
    number: '014',
    name: 'Jade Saint',
    rite: 'necklaces',
    price: 3699, // TODO
    model: 'jadeSaint',
    accent: '#0F8A3C',
    glow: '#0F8A3C',
    brand: 'SAINTCHROME',
    tagline: 'Grown from the garden behind the altar, worn at the throat.',
    description:
      'An emerald crystal bar wrapped in silver vines, as if the chapel garden grew into the metal. A black chain winds through the cable links like a shadow. Its star carries a green stone, the colour of moss on old stone.',
    materials: ['Mirror-polished silver-tone metal', 'Black-plated woven chain', 'Faceted emerald-green crystal'], // TODO confirm
    details: ['Oval cable chain with woven black chain', 'Liquid-silver vine setting', 'Star charm with green stone', 'Lobster clasp with extender chain'],
    hotspots: {
      crystal: { title: 'Jade Crystal', text: 'Step-cut emerald green. Deep as a forest after rain.' },
      pave: { title: 'The Pavé Back', text: 'Turn it over: the back of the setting is chrome set edge to edge with tiny glittering stones, with molten points along its edges.' },
      star: { title: 'Star of the Saint', text: 'The four-point star set with a single green stone.' },
      chain: { title: 'Woven Shadow', text: 'Oval cable links with a fine black chain woven through them.' },
      clasp: { title: 'Lobster Clasp', text: 'A spring lobster clasp with an extender chain and an oval tag.' },
    },
    reference: ['necklaces/6958.jpg', 'necklaces/6956.jpg', 'necklaces/6957.jpg'], // same necklace as Azure Saint, other stone
  },
  {
    slug: 'the-visitor',
    number: '007',
    name: 'The Visitor',
    rite: 'necklaces',
    price: 2999, // TODO
    model: 'theVisitor',
    accent: '#0F8A3C',
    glow: '#0F8A3C',
    brand: 'SAINTCHROME',
    tagline: 'Not every saint came from this world.',
    description:
      'An apparition in mirror chrome. A smooth alien head, its almond eyes sunk in green enamel, is set right into a wide, flat curb chain, just above where the two sides meet. At the bottom hangs a fallen star. For the believer who looks up and wonders who\'s looking back.',
    materials: ['Mirror-polished silver-tone metal', 'Green enamel eyes', 'Diamond-cut curb chain'], // TODO confirm
    details: ['Alien head set into the chain', 'Four-point star charm with a long lower arm', 'Lobster clasp with extender chain', 'Maker\'s tag'],
    hotspots: {
      alien: { title: 'The Visitor', text: 'A teardrop alien head polished to a liquid mirror. It sits inside the chain, following its curve: links run in at the crown and out at the chin.' },
      eyes: { title: 'Emerald Eyes', text: 'Two large slanted almond eyes of glossy green enamel, sunk into polished rims. They follow you around the room.' },
      star: { title: 'Fallen Star', text: 'A plain four-point star with a long lower arm, hanging from the ring where both sides of the chain meet.' },
      chain: { title: 'Curb Chain', text: 'Wide, flat curb links that lie face-up and interlock, with diamond-cut faces.' },
      clasp: { title: 'Lobster Clasp', text: 'A spring lobster clasp with an extender chain and a maker\'s tag.' },
    },
    reference: ['necklaces/6960.jpg', 'necklaces/6959.jpg', 'necklaces/6961.jpg'],
  },
  {
    slug: 'emerald-vision',
    number: '008',
    name: 'Emerald Vision',
    rite: 'eyewear',
    price: 8990, // TODO
    model: 'emeraldVision',
    accent: '#0F8A3C',
    glow: '#0F8A3C',
    brand: 'Ray-Ban',
    resale: true,
    tagline: 'Stained glass for the eyes.',
    description:
      'An original Ray-Ban collaboration, chosen for the altar. Square wayfarer lines in transparent emerald acetate, with curved clear lenses set into the rims, two chrome rivets on each corner, chrome barrel hinges and the Ray-Ban script in silver on both temples. Light passes through it the way it passes through a chapel window.',
    materials: ['Original Ray-Ban', 'Transparent green acetate frame', 'Clear lenses'], // TODO confirm model & lens spec
    details: ['Original Ray-Ban collaboration', 'Square wayfarer silhouette', 'Silver Ray-Ban script on both temples', 'Two chrome rivets on each corner', 'Chrome barrel hinges that fold flat'],
    finish: 'emerald',
    variants: [{ finish: 'obsidian', label: 'OBSIDIAN', slug: 'noir-vision' }, { finish: 'emerald', label: 'EMERALD', slug: 'emerald-vision' }],
    hotspots: {
      frame: { title: 'Emerald Acetate', text: 'Transparent green acetate. Light pours through it, and the hinges and core wire show inside.' },
      lens: { title: 'Clear Lens', text: 'Clear lenses set into the rims with a gentle inward curve.' },
      rivets: { title: 'Corner Rivets', text: 'Two chrome rivets stacked on each outer corner, set flush into the acetate.' },
      hinge: { title: 'Barrel Hinge', text: 'Chrome barrel hinges. The temples fold flat and open with a firm, quiet swing.' },
      logo: { title: 'Ray-Ban Signature', text: 'The Ray-Ban script in polished silver on both temples, the mark of an original.' },
      temple: { title: 'The Temple', text: 'Deep at the hinge, tapering back, then curving down and gently in behind the ear.' },
    },
    // scroll story on the product page (src/pages/sequenceEyewear.js)
    story: {
      kind: 'eyewear',
      switchTo: 'obsidian',
      captions: [
        { title: 'Folded, at rest.', text: 'One piece of acetate, cut and polished by hand.' },
        { title: 'Open the hinges.', text: 'Chrome barrel hinges swing the temples out, smooth and sure.' },
        { title: 'Every line catches light.', text: 'Turn it slowly. The rims carry the room in long white streaks.' },
        { title: 'Up close.', text: 'Two rivets on each corner, set into the acetate beside the hinge.' },
        { title: 'Taken apart.', text: 'Front, lenses, rivets, hinges, temples. Nothing here is an afterthought.' },
        { title: 'Now in Obsidian.', text: 'The same frame in glossy black acetate. Severe, timeless, made for every rite.' },
      ],
      labels: { acetate: 'Hand-polished acetate', lens: 'Crystal-clear lenses', hinge: 'Chrome barrel hinges', rivet: 'Signature ✦ rivets' },
    },
    reference: ['eyewear/6977.jpg', 'eyewear/6981.jpg', 'eyewear/6979.jpg'],
  },
  {
    slug: 'noir-vision',
    number: '009',
    name: 'Noir Vision',
    rite: 'eyewear',
    price: 8490, // TODO
    model: 'noirVision',
    accent: '#8c95a3',
    brand: 'Ray-Ban',
    resale: true,
    tagline: 'The confessional, in gloss black.',
    description:
      'An original Ray-Ban collaboration, chosen for the altar. Gloss-black acetate cut in a bold square wayfarer, with curved clear lenses set into the rims, two chrome rivets on each corner, chrome barrel hinges and the Ray-Ban script in silver on both temples. Severe and timeless, the kind of black you wear to every rite.',
    materials: ['Original Ray-Ban', 'Gloss black acetate frame', 'Clear lenses', 'Frame marked "Made in Italy"'], // TODO confirm
    details: ['Original Ray-Ban collaboration', 'Square wayfarer silhouette', 'Silver Ray-Ban script on both temples', 'Two chrome rivets on each corner', 'Chrome barrel hinges that fold flat'],
    finish: 'obsidian',
    variants: [{ finish: 'obsidian', label: 'OBSIDIAN', slug: 'noir-vision' }, { finish: 'emerald', label: 'EMERALD', slug: 'emerald-vision' }],
    hotspots: {
      frame: { title: 'Gloss Black', text: 'Polished black acetate that reflects the room like a still lake.' },
      lens: { title: 'Clear Lens', text: 'Clear lenses set into the rims with a gentle inward curve. Nothing between you and the world.' },
      rivets: { title: 'Corner Rivets', text: 'Two chrome rivets stacked on each outer corner, set flush into the acetate.' },
      hinge: { title: 'Barrel Hinge', text: 'Chrome barrel hinges. The temples fold flat and open with a firm, quiet swing.' },
      logo: { title: 'Ray-Ban Signature', text: 'The Ray-Ban script in polished silver on both temples, the mark of an original.' },
      temple: { title: 'The Temple', text: 'Deep at the hinge, tapering back, then curving down and gently in behind the ear.' },
    },
    // scroll story on the product page (src/pages/sequenceEyewear.js)
    story: {
      kind: 'eyewear',
      switchTo: 'emerald',
      captions: [
        { title: 'Folded, at rest.', text: 'One piece of acetate, cut and polished by hand.' },
        { title: 'Open the hinges.', text: 'Chrome barrel hinges swing the temples out, smooth and sure.' },
        { title: 'Every line catches light.', text: 'Turn it slowly. The rims carry the room in long white streaks.' },
        { title: 'Up close.', text: 'Two rivets on each corner, set into the acetate beside the hinge.' },
        { title: 'Taken apart.', text: 'Front, lenses, rivets, hinges, temples. Nothing here is an afterthought.' },
        { title: 'Now in Emerald.', text: 'The same frame in transparent green acetate. The hinges and core wire glow through.' },
      ],
      labels: { acetate: 'Hand-polished acetate', lens: 'Crystal-clear lenses', hinge: 'Chrome barrel hinges', rivet: 'Signature ✦ rivets' },
    },
    reference: ['eyewear/6988.jpg', 'eyewear/6990.jpg', 'eyewear/6989.jpg'],
  },
  {
    slug: 'sulfur-vision',
    number: '010',
    name: 'Sulfur Vision',
    rite: 'eyewear',
    price: 8490, // TODO
    model: 'sulfurVision',
    accent: '#d8b400',
    glow: '#d8b400',
    brand: 'Ray-Ban',
    resale: true,
    tagline: 'Every day looks like golden hour in the cathedral.',
    description:
      'An original Ray-Ban collaboration, chosen for the altar. Gloss-black square wayfarer acetate with curved sulfur-yellow lenses that turn grey days to gold, and the Ray-Ban script in silver on both temples. Black outside, warm light inside.',
    materials: ['Original Ray-Ban', 'Gloss black acetate frame', 'Yellow-tinted lenses'], // TODO confirm
    details: ['Original Ray-Ban collaboration', 'Square wayfarer silhouette', 'Silver Ray-Ban script on both temples', 'Two chrome rivets on each corner', 'Chrome barrel hinges that fold flat'],
    hotspots: {
      frame: { title: 'Gloss Black', text: 'Polished black acetate.' },
      lens: { title: 'Sulfur Lens', text: 'Curved yellow-tinted lenses that warm every colour they touch.' },
      rivets: { title: 'Corner Rivets', text: 'Two chrome rivets stacked on each outer corner, set flush into the acetate.' },
      hinge: { title: 'Barrel Hinge', text: 'Chrome barrel hinges. The temples fold flat and open with a firm, quiet swing.' },
      logo: { title: 'Ray-Ban Signature', text: 'The Ray-Ban script in polished silver on both temples, the mark of an original.' },
      temple: { title: 'The Temple', text: 'Deep at the hinge, tapering back, then curving down and gently in behind the ear.' },
    },
    // scroll story on the product page (src/pages/sequenceEyewear.js)
    story: {
      kind: 'eyewear',
      switchTo: null,
      captions: [
        { title: 'Folded, at rest.', text: 'One piece of acetate, cut and polished by hand.' },
        { title: 'Open the hinges.', text: 'Chrome barrel hinges swing the temples out, smooth and sure.' },
        { title: 'Every line catches light.', text: 'Turn it slowly. The rims carry the room in long white streaks.' },
        { title: 'Up close.', text: 'Two rivets on each corner, set into the acetate beside the hinge.' },
        { title: 'Taken apart.', text: 'Front, lenses, rivets, hinges, temples. Nothing here is an afterthought.' },
        { title: 'Back together.', text: 'Gloss-black acetate, sulfur glass. Grey days, turned to gold.' },
      ],
      labels: { acetate: 'Hand-polished acetate', lens: 'Crystal-clear lenses', hinge: 'Chrome barrel hinges', rivet: 'Signature ✦ rivets' },
    },
    reference: ['eyewear/6984.jpg', 'eyewear/6986.jpg', 'eyewear/6983.jpg'],
  },
  {
    slug: 'silent-choir',
    number: '011',
    name: 'Silent Choir USB-C',
    rite: 'earphones',
    price: 4999, // TODO
    model: 'silentChoir',
    accent: '#BFE6FF',
    glow: '#BFE6FF',
    brand: 'SAINTCHROME',
    tagline: 'A private choir that sings only for you.',
    description:
      'Wired earphones cast in mirror chrome. Two polished buds on long chrome stems, a grey cable, an inline remote and a USB-C plug. No pairing and no battery to die: plug in and the hymn of the city comes in close, while the rest of the world stays outside the chapel doors.',
    materials: ['Mirror-chrome earbud shells and stems', 'Grey cable', 'Chrome inline remote', 'Chrome USB-C plug'], // TODO confirm
    details: ['Wired, half in-ear fit', 'Inline remote with volume + / − and a centre button', 'USB-C connector', 'Cable length: TODO'], // TODO
    hotspots: {
      bud: { title: 'Chrome Earbud', text: 'A half in-ear bud in mirror chrome, with a dark speaker mesh facing the ear.' },
      stem: { title: 'Chrome Stem', text: 'A long polished stem with a stepped chrome collar where it meets the cable.' },
      remote: { title: 'Inline Remote', text: 'Volume + and − with a smoked-chrome centre button, right where your hand falls.' },
      plug: { title: 'USB-C', text: 'A chrome-housed USB-C plug for phones, tablets and laptops.' },
    },
    reference: ['earphones/chrome-wired-usbc.png'],
    // scroll story on the product page (src/pages/sequence.js)
    story: {
      captions: [
        { title: 'Cast in mirror chrome.', text: 'Two buds, polished until they hold the whole room in their skin.' },
        { title: 'Listen closer.', text: 'A graphite mesh, perforated finer than a prayer said under your breath.' },
        { title: 'Opened like a reliquary.', text: 'Shell, driver, control. Every part made to be looked at.' },
        { title: 'Plug in. Go silent.', text: 'USB-C. No battery to die, no pairing to fail. Only the choir.' },
      ],
      labels: { shell: 'Mirror-chrome shell', driver: 'Precision driver', control: 'Inline control' },
    },
  },
  {
    slug: 'silent-choir-lightning',
    number: '015',
    name: 'Silent Choir Lightning',
    rite: 'earphones',
    price: 4999, // TODO
    model: 'silentChoirLightning',
    accent: '#BFE6FF',
    glow: '#BFE6FF',
    brand: 'SAINTCHROME',
    tagline: 'The same choir, for the Lightning faithful.',
    description:
      'The Silent Choir with a Lightning plug, for iPhones and iPads with a Lightning port. Two mirror-chrome buds on long chrome stems, a grey cable, an inline remote and a chrome-housed Lightning connector. Plug in and the city goes quiet.',
    materials: ['Mirror-chrome earbud shells and stems', 'Grey cable', 'Chrome inline remote', 'Chrome Lightning plug'], // TODO confirm
    details: ['Wired, half in-ear fit', 'Inline remote with volume + / − and a centre button', 'Lightning connector', 'Cable length: TODO'], // TODO
    hotspots: {
      bud: { title: 'Chrome Earbud', text: 'A half in-ear bud in mirror chrome, with a dark speaker mesh facing the ear.' },
      stem: { title: 'Chrome Stem', text: 'A long polished stem with a stepped chrome collar where it meets the cable.' },
      remote: { title: 'Inline Remote', text: 'Volume + and − with a smoked-chrome centre button, right where your hand falls.' },
      plug: { title: 'Lightning', text: 'A chrome-housed Lightning plug with a reversible blade, for iPhone and iPad.' },
    },
    reference: ['earphones/chrome-wired-usbc.png'],
    story: {
      captions: [
        { title: 'Cast in mirror chrome.', text: 'Two buds, polished until they hold the whole room in their skin.' },
        { title: 'Listen closer.', text: 'A graphite mesh, perforated finer than a prayer said under your breath.' },
        { title: 'Opened like a reliquary.', text: 'Shell, driver, control. Every part made to be looked at.' },
        { title: 'Plug in. Go silent.', text: 'Lightning. No battery to die, no pairing to fail. Only the choir.' },
      ],
      labels: { shell: 'Mirror-chrome shell', driver: 'Precision driver', control: 'Inline control' },
    },
  },
];

export const bySlug = (slug) => PRODUCTS.find((p) => p.slug === slug);
export const byRite = (rite) => PRODUCTS.filter((p) => p.rite === rite);
export const riteBySlug = (slug) => RITES.find((r) => r.slug === slug);
