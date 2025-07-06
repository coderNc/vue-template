<script setup lang="ts">
import { useCounterStore } from '@/store/counter';

defineProps<{ msg: string }>();

const store = useCounterStore();
</script>

<template>
  <h1>{{ msg }}</h1>
  <div class="card">
    <el-button @click="store.increment()">count is {{ store.count }}</el-button>
    <el-button @click="store.decrement()" class="ml-2">-</el-button>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
