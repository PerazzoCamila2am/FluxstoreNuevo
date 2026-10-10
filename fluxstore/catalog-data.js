// Catálogo base. El stock se actualiza desde Google Sheets por Apps Script.
const products = [

  {
    id: "maskking-100k",
    name: "Maskking",
    puffs: "100k",
    price: 32990,
    image: "assets/maskking-100k.webp",
    flavors: "Sour Apple Ice, Alaska Ice, Frozen Piña Colada, Fruity Cool Strawberry, Strawberry B-Burst, Banana Taffy Freeze, White Gummy Ice, Mexico Mango",
    flavorOptions: [
      { name: "Sour Apple Ice/Manzana Ácida Helada", image: "assets/maskking-sour-apple-ice.webp"},
      { name: "Alaska Ice/Mentol Extra Frío", image: "assets/maskking-alaska-ice.webp"},
      { name: "Frozen Piña Colada/Piña Colada Helada", image: "assets/maskking-frozen-pina-colada.webp"},
      { name: "Fruity Cool Strawberry/Frutilla Helada", image: "assets/maskking-fruity-cool-strawberry.webp"},
      { name: "Strawberry B-Burst/Explosión De Frutilla", image: "assets/maskking-strawberry-b-burst.webp"},
      { name: "Banana Taffy Freeze/Caramelo De Banana Helado", image: "assets/maskking-banana-taffy-freeze.webp"},
      { name: "White Gummy Ice/Gomita Blanca Helada", image: "assets/maskking-white-gummy-ice.webp"},
      { name: "Mexico Mango/Mango Mexicano", image: "assets/maskking-mexico-mango.webp"},

    ]
  },

   {
    id: "waka-70k",
    name: "Waka",
    puffs: "70k",
   /* oldPrice: 29990,
    discount: "10% OFF",*/
    price: 29990,
    image: "assets/waka-70k.webp",
    flavors: "Passion Fruit, Green Apple, Cherry Bomb, Strawberry, Watermelon, Fresh Mint",
    flavorOptions: [
      { name: "Passion Fruit/Maracuyá", image: "assets/waka-passionfruit.webp"},
      { name: "Green Apple/Manzana Verde", image: "assets/waka-greenapple.webp"},
      { name: "Cherry Bomb/Cereza", image:"assets/waka-cherry-bomb.webp"},
      { name: "Strawberry/Frutilla", image: "assets/waka-strawberry.webp"},
      { name: "Watermelon/Sandía", image: "assets/waka-watermelon.webp"},
      { name: "Fresh Mint/Menta Fresca", image:"assets/waka-fresh-mint.webp"},
      { name: "Grape/Uva", image:"assets/waka-grape.webp"},
    ]
  },

  {
    id: "waka-25k",
    name: "Waka25",
    puffs: "25k",
    price: 21500,
    image: "assets/waka-25k.webp",
    flavors: "Strawmelon Peach, Bubbaloo Grape, Strawberry Grape",
    flavorOptions: [
      { name: "Strawmelon Peach/Frutilla, Melón y Durazno", image: "assets/waka25-strawmelon-peach.webp" },
      { name: "Bubbaloo Grape/Chicle De Uva", image: "assets/waka25-bubbaloo-grape.webp"},
      { name: "Strawberry Grape/Frutilla y Uva", image: "assets/waka25-strawberry-graoe.webp"},
    ]
  },

   {
    id: "Ebcreate-40k",
    name: "Ebcreate",
    puffs: "40k",
    price: 28990,
    image: "assets/ebcreate-40k.webp",
    flavors: "Aurora Berries, Blackberry Grape, Strawberry Raspberry Frost, Triple Berry, Watermelon Ice, Black Mint, Toasted Pineapple",
    flavorOptions: [
      { name: "Aurora Berries/Frutos Rojos", image: "assets/ebcreate-auroraberries.webp"},
      { name: "Blackberry Grape/Mora y Uva", image: "assets/ebcreate-blackberrygrape.webp"},
      { name: "Strawberry Raspberry Frost/Frutilla y Frambuesa Heladas", image: "assets/ebcreate-strawberryraspberryfrost.webp"},
      { name: "Triple berry/Triple Frutos Rojos", image: "assets/ebcreate-triple-berry.webp"},
      { name: "Watermelon Ice/Sandía Helada", image: "assets/ebcreate-watermelon-ice.webp"},
      { name: "Black Mint/Menta", image: "assets/ebcreate-black-mint.webp"},
      { name: "Toasted Pineapple/Piña Caramelizada", image:"assets/ebcreate-toasted-pineapple.webp"},
    ]
  },

  {
    id: "elfbar-ice-40k",
    name: "Elfbar",
    puffs: "40k",
    price: 27990,
    image: "assets/elfbar-ice-40k.webp",
    flavors: "Bubbaloo Tutti Frutti, Baja Splash, Peach Blue Slush, Strawberry Watermelon, Hawaiian Slush, Black Mint, Cherry Fuse, Miami Mint, Dragon Strawnana, Grape Ice, Bubbaloo Grape, Blueberry Ice, Blue Razz Ice, Peach, Cola Slush, Cranberry Pineapple Juice, Cherry Strazz, Green Apple Ice, Mango Magic, Strawberry Ice",
    flavorOptions: [
      { name: "Baja Splash/Lima Limón y Frutas Tropicales", image: "assets/elfbar-baja-splash.webp"},
      { name: "Peach Blue Slush/Duranzno y Arándanos Refrescante", image: "assets/elfbar-peach-blue-slush.webp"},
      { name: "Strawberry Watermelon/Frutilla y Sandia", image: "assets/elfbar-strawberry-watermelon.webp"},
      { name: "Hawaiian Slush/Ananá, Mango y Citricos Refrescantes", image: "assets/elfbar-hawaiian-slush.webp"},
      { name: "Black Mint/Menta Refrescante", image: "assets/elfbar-black-mint.webp"},
      { name: "Cherry Fuse/Cereza", image: "assets/elfbar-cherry-fuse.webp"},
      { name: "Miami Mint/Menta", image: "assets/elfbar-miami-mint.webp"},
      { name: "Dragon Strawnana/Frutilla, Banana y Fruta Del Dragon", image: "assets/elfbar-dragon-strawnana.webp"},
      { name: "Grape Ice/ Uva Helada", image: "assets/elfbar-grape-ice.webp"},
      { name: "Bubbaloo Tutti Frutti/Chicle Tutti Frutti", image: "assets/elfbar-bubbaloo-tutti-frutti.webp"},
      { name: "Bubbaloo Grape/Chicle De Uva", image:"assets/elfbar-bubbaloo-grape.webp"},
      { name: "Blueberry Ice/Arándano Helado", image: "assets/elfbar-blueberry-ice.webp"},
      { name: "Blue Razz Ice/Frambuesa Helada", image: "assets/elfbar-blue-razz-ice.webp"},
      { name: "Peach/Durazno", image: "assets/elfbar-peach+.webp"},
      { name: "Cola Slush/Coca Cola", image: "assets/elfbar-cola-slush.webp"},
      { name: "Cranberry Pineapple Juice/Arandano Rojo", image: "assets/elfbar-cranberry-pineapple-juice.webp"},
      { name: "Cherry Strazz/Cereza Y Frutilla", image: "assets/elfbar-cherry-strazz.webp"},
      { name: "Green Apple Ice/Manzana Verde Helada", image: "assets/elfbar-green-apple-ice.webp"},
      { name: "Mango Magic/Mango", image: "assets/elfbar-mango-magic.webp"},
      { name: "Strawberry Ice/Frutilla Helada", image: "assets/elfbar-strawberry-ice.webp"},
    ]
  },
 
  {
    id: "rabbeats-50k",
    name: "RabBeats",
    puffs: "50k",
    price: 27990,
    image: "assets/rabbeats-50k.webp",
    flavors: "Icy Mint, Blueberry Lemon, Strawberry Ice, Pineapple Ice, Fanta Strawberry, Banana Ice, Menthol, Sakura Grape, Triple Berry, Watermelon Ice",
    flavorOptions: [
      { name: "Icy Mint/Menta Helada", image: "assets/rabbeats-icy-mint.webp"},
      { name: "Blueberry Lemon/Arándano Con Limón", image: "assets/rabbeats-blueberry-lemon.webp"},
      { name: "Strawberry Ice/Frutilla Helada", image: "assets/rabbeats-strawberry-ice.webp"},
      { name: "Pineapple Ice/Ananá Helada", image: "assets/rabbeats-pineapple-ice.webp"},
      { name: "Fanta Strawberry/Fanta De Frutilla", image: "assets/rabbeats-fanta-strawberry.webp"},
      { name: "Banana Ice/Banana Helada", image: "assets/rabbeats-banana-ice.webp"},
      { name: "Menthol/Mentol", image: "assets/rabbeats-menthol.webp"},
      { name: "Sakura Grape/Uva Sakura", image: "assets/rabbeats-sakura-grape.webp"},
      { name: "Triple Berry/Triple Frutos Rojos", image: "assets/rabbeats-triple-berry.webp"},
      { name: "Watermelon Ice/Sandia Helada", image: "assets/rabbeats-watermelon-ice.webp"}
    ]
  },
  
  {
    id: "ignite-ice-40k",
    name: "Ignite",
    puffs: "40k",
    price: 29990,
    /*oldPrice: 30000,
    discount: "15% OFF",*/
    image: "assets/ignite-ice-40k.webp",
    flavors: "Strawberry, Mint, Grape, Peach Berry Ice, Strawberry Watermelon, Banana Cherry, Watermelon Ice, Green Apple, Strawberry Apple Watermelon, Strawberry Kiwi",
    flavorOptions: [
      { name: "Strawberry/Frutilla", image: "assets/ignite-strawberry.webp"},
      { name: "Mint/Menta", image: "assets/ignite-ice-mint.webp"},
      { name: "Grape/Uva", image: "assets/ignite-grape.webp"},
      { name: "Peach Berry Ice/Durazno Y Frutos Rojos Helados", image: "assets/ignite-peach-berry-ice.webp"},
      { name: "Strawberry Watermelon/Frutilla y Sandia", image: "assets/ignite-strawberry-watermelon.webp"},
      { name: "Banana Cherry/Banana Con Cereza", image: "assets/ignite-banana-cherry.webp"},
      { name: "Watermelon Ice/Sandia Helada", image: "assets/ignite-watermelon-ice.webp"},
      { name: "Green Apple/Manzana Verde", image: "assets/ignite-green-apple.webp"},
      { name: "Strawberry Apple Watermelon/ Frutilla,Manzana y Sandia", image: "assets/ignite-strawberry-apple-watermelon.webp"},
      { name: "Strawberry Kiwi/Frutilla y Kiwi", image: "assets/ignite-strawberry-kiwi.webp"},
    ]
  },


  /*{
    id: "wefume-30k",
    name: "Wefume",
    puffs: "30k",
    price: 23990,
    promoQty: 2,
    promoPrice: 41990,
    promoText: "Llevando 2: $41.990",
    image: "assets/wefume-30k.webp",
    flavors: "Strawberry Kiwi, Lush Ice, Apple Pineapple, Miami Mix, Ice Mint",
    flavorOptions: [
      { name: "Strawberry Kiwi", image: "assets/wefume-strawberry-kiwi.webp",  stock: false},
      { name: "Lush Ice", image: "assets/wefume-lush-ice.webp",  stock: true},
      { name: "Apple Pineapple", image: "assets/wefume-apple-pineapple.webp",  stock: false},
      { name: "Miami Mix", image: "assets/wefume-miami-mix.webp",  stock: false},
      { name: "Ice Mint", image: "assets/wefume-ice-mint.webp",  stock: false}
    ]
  },*/

   {
    id: "luffbar-55k",
    name: "Luffbar",
    puffs: "55k",
    price: 26990,
    image: "assets/luffbar-55k.webp",
    flavors: "Fruity Cool Dragonfruit, Alaska Ice, Straw Nana, Grape Menthol, Grape Slushy",
    flavorOptions: [
      { name: "Fruity Cool Dragonfruit/Pitahaya Frutal Refrescante", image: "assets/luffbar-fruity-cool-dragonfruit.webp"},
      { name: "Alaska Ice/Menta Helada", image: "assets/luffbar-alaska-ice.webp"},
      { name: "Straw Nana/Frutilla Con Banana", image: "assets/luffbar-straw-nana.webp"},
      { name: "Grape Menthol/Uva Mentol", image: "assets/luffbar-fruity-cool-grape-menthol.webp"},
      { name: "Grape Slushy/Granizado De Uva", image: "assets/luffbar-grape-slushy.webp"}
    ]
  },

  {
    id: "lost-mary-20k",
    name: "Lost Mary MO20000 Pro",
    puffs: "20k",
    price: 17990,
    image: "assets/lost-mary-20k.webp",
    flavors: "Ice Mint",
    flavorOptions: [
      { name: "Ice Mint/Menta Helada", image: "assets/lostmary-ice-mint.webp"}
    ],
    soldOut: true
  }
];

