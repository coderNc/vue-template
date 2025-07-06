<template>
  <div class="about">
    <FormBuilder ref="formBuilder" v-model="formData" :formItems="formItems" :rules="rules" />
    <el-button type="primary" @click="onSubmit">提交</el-button>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue';

const formBuilder = ref();
const formData = reactive({
  name: null,
  age: null,
  sex: null,
});

const formItems = ref([
  {
    key: 'name',
    component: 'input',
    label: '姓名',
    placeholder: '请输入姓名',
    clearable: true,
    span: 12,
    onChange: (value: string) => {
      console.log(value);
    },
    onClear: () => {
      console.log('clear');
    },
  },
  {
    key: 'age',
    component: 'inputNumber',
    label: '年龄',
    placeholder: '请输入年龄',
  },
  {
    key: 'sex',
    component: 'radioGroup',
    label: '性别',
    hidden: computed(() => formData.age && formData.age < 18),
    options: [
      {
        label: '男',
        value: 'male',
      },
      {
        label: '女',
        value: 'female',
      },
    ],
  },
  {
    key: 'date',
    component: 'datePicker',
    label: '日期',
    type: 'daterange',
    format: 'YYYY/MM/DD',
    valueFormat: 'YYYY-MM-DD',
    placeholder: '请选择日期',
    span: 12,
    onChange(val: Date) {
      console.log('datePicker', val);
    },
  },
  {
    key: 'city',
    component: 'select',
    label: '城市',
    span: 12,
    options: [
      {
        value: 'Beijing',
        label: 'Beijing',
      },
      {
        value: 'Shanghai',
        label: 'Shanghai',
      },
      {
        value: 'Nanjing',
        label: 'Nanjing',
      },
      {
        value: 'Chengdu',
        label: 'Chengdu',
      },
      {
        value: 'Shenzhen',
        label: 'Shenzhen',
      },
      {
        value: 'Guangzhou',
        label: 'Guangzhou',
      },
    ],
  },
]);

const rules = reactive({
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
});

const onSubmit = async () => {
  const flag = await formBuilder.value.validate();
  console.log(flag);
};

watch(
  () => formData,
  (val) => {
    console.log(val);
  },
  { deep: true }
);
</script>

<style scoped>
.about {
  padding: 20px;
}
</style>
