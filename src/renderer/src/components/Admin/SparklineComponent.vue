<template>
    <v-sparkline
      :auto-line-width="autoLineWidth"
      :fill="fill"
      :gradient="gradient"
      :gradient-direction="gradientDirection"
      :line-width="width"
      :model-value="value.map(item => item.value)"
      :padding="padding"
      :smooth="true"
      :stroke-linecap="lineCap"
      :type="type"
      auto-draw
      show-labels
    >
    <template #label="{ index }">
      {{ value[index].label }} ({{ value[index].value }})
    </template>
    </v-sparkline>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const { value } = defineProps({
  value: {
    type: Array,
    required: true,
    default: () => [
      { label: 'January', value: 0 },
      { label: 'February', value: 0 },
      { label: 'March', value: 0 },
      { label: 'April', value: 0 },
      { label: 'May', value: 0 },
      { label: 'June', value: 0 },
      { label: 'July', value: 0 },
      { label: 'August', value: 0 },
      { label: 'September', value: 0 },
      { label: 'October', value: 0 },
      { label: 'November', value: 0 },
      { label: 'December', value: 0 }
    ]
  }
})
  
  const gradients = [
    ['#222'],
    ['#42b3f4'],
    ['red', 'orange', 'yellow'],
    ['purple', 'violet'],
    ['#00c6ff', '#F0F', '#FF0'],
    ['#f72047', '#ffd200', '#1feaea'],
  ]
  
  const width = ref(2)
  //const radius = ref(10)
  const padding = ref(16)
  const lineCap = ref('round')
  const gradient = ref(gradients[5])
  const gradientDirection = ref('top')
  const fill = ref(false)
  const type = ref('trend')
  const autoLineWidth = ref(false)
  </script>