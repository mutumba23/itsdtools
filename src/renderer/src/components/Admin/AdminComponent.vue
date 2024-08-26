<template>
  <v-sheet style="height: 90vh">
    <v-card flat class="pa-2 mt-2 show-scrollbar container" style="height: 100%">
      <v-card-title>ITSD Tools Usage</v-card-title>
      <div class="text-center my-4">
        <v-btn variant="text" prepend-icon="fas fa-arrows-rotate" @click="refreshData"
          >Refresh Data</v-btn
        >
      </div>
      <v-select
        v-model="selectedCategory"
        :items="categories"
        label="Select Category"
        outlined
        item-title="name"
        item-value="value"
        return-object
        @update:model-value="updateChartData"
      ></v-select>
      <div class="chart-container pa-0 ma-0">
        <BarChart v-if="totalChartData" :chart-data="totalChartData" class="mb-8" />
        <BarChart v-if="monthlyChartData" :chart-data="monthlyChartData" />

        <div class="mx-auto text-center">
          <v-btn
            prepend-icon="fas fa-chevron-left"
            size="x-small"
            variant="text"
            class="mr-2 mb-4"
            @click="previousMonth"
            >Prev month</v-btn
          >
          <v-btn append-icon="fas fa-chevron-right" size="x-small" variant="text" class="mb-4" @click="nextMonth"
            >Next month</v-btn
          >
        </div>

      </div>


    </v-card>
  </v-sheet>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getButtonStatistics } from "../../firebase.js";
import BarChart from "./BarChart.vue";
const selectedCategory = ref({ name: 'Communication', value: 'communications' })
const categories = ref([
  {
    name: 'Communication',
    value: 'communications'
  },
  {
    name: 'Common Tools',
    value: 'commonTools'
  },
  {
    name: 'Remote Assistance',
    value: 'remoteAssistance'
  },
  {
    name: 'Scripts',
    value: 'scripts'
  }
])
const targetMonth = ref('2024-03')
const buttonStatistics = ref(null)
const monthlyChartData = ref(null)
const totalChartData = ref(null)

const refreshData = async () => {
  const data = await getButtonStatistics();
      buttonStatistics.value = data;

      updateChartData();
}

const updateChartData = () => {
  const filteredStatistics = buttonStatistics.value.filter(
    (stat) => stat.category === selectedCategory.value.value
  );

  const labels = [];
  const totalUsageCounts = [];
  const monthlyUsageCounts = [];

  filteredStatistics.forEach((stat) => {
    const totalUsageCount = Object.values(stat.monthlyUsageCounts).reduce((acc, count) => acc + count, 0);
    const monthlyUsageCount = stat.monthlyUsageCounts[targetMonth.value] || 0;

    // Only include statistics where the total or monthly usage count is greater than 0
    if (totalUsageCount > 0) {
      labels.push(stat.label);
      totalUsageCounts.push(totalUsageCount);

      // Only push monthly usage count if it is greater than 0
      if (monthlyUsageCount > 0) {
        monthlyUsageCounts.push(monthlyUsageCount);
      } else {
        monthlyUsageCounts.push(null); // Push null to maintain the alignment with labels
      }
    }
  });

  // Filter out the entries where monthlyUsageCounts is null
  const filteredLabels = [];
  const filteredTotalUsageCounts = [];
  const filteredMonthlyUsageCounts = [];

  for (let i = 0; i < monthlyUsageCounts.length; i++) {
    if (monthlyUsageCounts[i] !== null) {
      filteredLabels.push(labels[i]);
      filteredTotalUsageCounts.push(totalUsageCounts[i]);
      filteredMonthlyUsageCounts.push(monthlyUsageCounts[i]);
    }
  }

  const targetDate = new Date(targetMonth.value); // Create a Date object for the target month
  const monthLabel = targetDate.toLocaleString('default', { month: 'long' });

  totalChartData.value = {
    labels: filteredLabels,
    datasets: [
      {
        label: "Total Usage Count",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
        data: filteredTotalUsageCounts,
      }
    ],
  };

  monthlyChartData.value = {
    labels: filteredLabels,
    datasets: [
      {
        label: monthLabel,
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
        data: filteredMonthlyUsageCounts,
      }
    ],
  };
};

const nextMonth = () => {
      const currentMonth = new Date(targetMonth.value);
      currentMonth.setMonth(currentMonth.getMonth() + 1);
      targetMonth.value = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      updateChartData();
};

const previousMonth = () => {
      const currentMonth = new Date(targetMonth.value);
      currentMonth.setMonth(currentMonth.getMonth() - 1);
      targetMonth.value = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      updateChartData();
};
///////////////////////////////////////////////////
//Mounted
///////////////////////////////////////////////////
onMounted(async () => {

  // Update this.targetMonth to the current month in the format of "YYYY-MM"
  const currentDate = new Date();
  targetMonth.value = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  // Fetch button statistics from the database
  refreshData();
});
//Mounted END
///////////////////////////////////////////////////
</script>

<style scoped>
.container {
  overflow-y: auto;
  overflow-x: hidden;
}

.chart-container {
  position: relative;
  height: 40vh;
  width: 80vw;
}
</style>
