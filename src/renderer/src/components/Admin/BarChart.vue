<template>
  <Bar :id="chartId" :options="chartOptions" :data="chartData" />
</template>

<script setup>
import { Bar } from "vue-chartjs";
import { ref } from 'vue';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

// Define props
const props = defineProps({
  chartData: {
    type: Object,
    required: true,
  },
});

// Define reactive variables
const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
});

const chartId = ref(`chart-${props.chartData._uid}`);

</script>
