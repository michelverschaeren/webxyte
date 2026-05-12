<template>
  <section class="py-24 bg-[#0f0d0d]">
    <div class="max-w-300 mx-auto px-6">
      <div class="text-center mb-12">
        <p
          class="uppercase tracking-[0.3em] text-[0.75rem] text-[#c89868] font-semibold mb-4"
        >
          — Uitgebreid gamma —
        </p>
        <h2
          class="font-['Playfair_Display',Georgia,serif] text-[clamp(2rem,4vw,3.25rem)] font-bold text-white mb-4 leading-[1.1]"
        >
          <span class="block">Van fijne vleeswaren tot</span>
          <span
            class="block font-['Dancing_Script',cursive] text-[#b8252a] font-normal text-[1.1em] mt-2"
            >bereide gerechten</span
          >
        </h2>
        <p
          class="max-w-150 mx-auto mt-6 text-[#a89a8e] leading-[1.7] text-[1.05rem]"
        >
          Van sauzen tot verpakkingsmateriaal. Bij Vleeswaren Vermeir kan u
          terecht voor ieder product en met al uw vragen betreffende die
          producten.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="product in featuredProducts"
          :key="product.name"
          class="group bg-[#1a1414] border border-white/8 rounded-lg overflow-hidden hover:-translate-y-1.5 hover:border-[#c89868] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300"
        >
          <div class="relative aspect-square overflow-hidden">
            <span
              v-if="product.sale"
              class="absolute top-4 left-4 bg-[#b8252a] text-white px-3 py-1 text-[0.7rem] font-bold tracking-widest z-2"
              >SALE</span
            >
            <img
              :src="product.image"
              :alt="product.name"
              class="w-full h-full object-cover group-hover:scale-[1.08] transition-transform duration-400"
            />
            <button
              class="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-[#b8252a] text-white text-[1.5rem] font-light border-none cursor-pointer flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-[#8b1f1f] hover:scale-110 transition-all duration-300"
              @click="addToCart(product.name)"
            >
              +
            </button>
          </div>
          <div class="p-5 text-center">
            <h3 class="text-white text-[1rem] m-0 mb-2 font-semibold">
              {{ product.name }}
            </h3>
            <div class="flex gap-2 justify-center items-baseline">
              <span
                v-if="product.oldPrice"
                class="text-[#a89a8e] line-through text-[0.9rem]"
                >€{{ product.oldPrice }}</span
              >
              <span class="text-[#b8252a] font-bold text-[1.1rem]"
                >€{{ product.price }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <div class="text-center mt-12">
        <NuxtLink
          to="/producten"
          class="inline-block border-2 border-[#c89868] text-[#c89868] px-8 py-[0.9rem] no-underline font-semibold uppercase tracking-[0.15em] text-[0.8rem] hover:bg-[#c89868] hover:text-[#1a0a0a] transition-all duration-200"
          >Alle producten →</NuxtLink
        >
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const cart = useCart();

function addToCart(name: string) {
  cart.addItem({
    id: `demo-${name}`,
    articleNr: "00000",
    name,
    supplier: "Demo leverancier",
  });
}

const featuredProducts = [
  {
    name: "Aged Pork Steak",
    price: "7.99",
    oldPrice: null,
    sale: false,
    image:
      "https://images.unsplash.com/photo-1432139509613-5c4255815697?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Beef Ribs",
    price: "8.99",
    oldPrice: null,
    sale: false,
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Pork Ham",
    price: "2.99",
    oldPrice: "3.99",
    sale: true,
    image:
      "https://images.unsplash.com/photo-1606851094291-6efae152bb87?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Chicken Body",
    price: "2.50",
    oldPrice: null,
    sale: false,
    image:
      "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=500&q=80",
  },
];
</script>
