<template>
  <v-card-subtitle
    >...or are you quick enough to solve the memory game in meantime?</v-card-subtitle
  >
  <v-card-title class="text-center">Memory game</v-card-title>
  <div>
    <!-- Game board displaying cards -->
    <div class="game-board d-flex flex-row flex-wrap justify-center">
      <div
        v-for="(card, index) in cards"
        :key="index"
        class="card ma-1"
        :class="{ flipped: card.visible, matched: card.matched }"
        @click="flipCard(index)"
      >
        <v-icon v-if="card.visible || card.matched" size="x-large">{{ card.icon }}</v-icon>
        <div v-else class="card-back"></div>
      </div>
    </div>
    <v-card-title v-if="gameOver" class="text-center">All cards matched!</v-card-title>
    <!-- Restart button -->
    <v-btn class="mt-4 mx-2" @click="restartGame">Restart game</v-btn>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const cards = ref([
  { icon: 'fas fa-coffee', visible: false, matched: false },
  { icon: 'fas fa-camera', visible: false, matched: false },
  { icon: 'fas fa-plane', visible: false, matched: false },
  { icon: 'fas fa-bicycle', visible: false, matched: false },
  { icon: 'fas fa-heart', visible: false, matched: false },
  { icon: 'fas fa-star', visible: false, matched: false }
])
const flippedCards = ref([])
const canFlip = ref(true)
const totalMatches = ref(0)
const gameOver = ref(false)

const generatePairs = () => {
    const duplicatedCards = [];
        cards.value.forEach(card => {
          duplicatedCards.push({...card});
          duplicatedCards.push({...card});
        });
        
        // Shuffle the duplicated cards
        shuffle(duplicatedCards);
        
        // Assign the shuffled duplicated cards to the main cards array
        cards.value = duplicatedCards;
}

const flipCard = (index) => {
    if (!canFlip.value || cards.value[index].visible || flippedCards.value.length === 2) return;
        
        cards.value[index].visible = true; // Use direct assignment
        flippedCards.value.push(index);
        
        if (flippedCards.value.length === 2) {
          canFlip.value = false;
          setTimeout(() => {
            checkMatch();
          }, 1000); // Adjust delay as needed
        }
}

const checkMatch = () => {
    const [firstIndex, secondIndex] = flippedCards.value;
        if (cards.value[firstIndex].icon === cards.value[secondIndex].icon) {
          cards.value[firstIndex].matched = true;
          cards.value[secondIndex].matched = true;
          totalMatches.value += 1;
        } else {
          // If the cards don't match, hide them again
          cards.value[firstIndex].visible = false;
          cards.value[secondIndex].visible = false;
        }
        
        flippedCards.value = []; // Reset flipped cards
        canFlip.value = true; // Allow flipping again
        
        if (totalMatches.value === cards.value.length / 2) {
          // All cards matched, perform action (e.g., stop game)
          console.log('All cards matched!');
          gameOver.value = true;
        }
}

const restartGame = () => {
    gameOver.value = false;
      // Shuffle the cards
      shuffle(cards.value);
      
      // Reset game state
      flippedCards.value = [];
      canFlip.value = true;
      totalMatches.value = 0;
      
      // Hide all cards
      cards.value.forEach(card => {
        card.visible = false;
        card.matched = false;
      });
}

const shuffle = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
}

onMounted(() => {
    generatePairs()
});
</script>

<style scoped>
.memory-game {
  display: grid;
  grid-template-columns: repeat(4, 100px); /* Adjust as needed */
  grid-gap: 10px; /* Adjust as needed */
}

.card {
  width: 100px; /* Adjust as needed */
  height: 100px; /* Adjust as needed */
  background-color: #ccc; /* Adjust as needed */
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.card-content {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.card img {
  max-width: 100%;
  max-height: 100%;
}
</style>
