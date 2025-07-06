<template>
  <div>
    <el-form ref="form" :model="modelValue" :rules="rules" v-bind="formProps" label-width="80px">
      <el-row>
        <el-col v-for="(item, index) in items" :key="index" :span="item.span || 24">
          <el-form-item :prop="item.key" :label="item.label">
            <slot :name="item.key">
              <component
                :is="getComponent(item)"
                v-bind="getProps(item)"
                v-model="modelValue[item.key]"
              >
                <template v-if="item.subComponent">
                  <component
                    :is="item.subComponent"
                    v-for="option in item.options"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </template>
              </component>
            </slot>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { useTemplateRef, computed } from 'vue';
import { type FormInstance, type FormProps, type FormRules } from 'element-plus';

const props = defineProps<{
  formItems: any[];
  rules: FormRules;
  formProps: Partial<FormProps>;
}>();

const items = computed(() => props.formItems.filter((item) => !item.hidden).map((item) => {
  const subComponent = getSubComponent(item);
  return {
    ...item,
    subComponent: subComponent,
  };
}));
const modelValue = defineModel<Record<string, any>>({
  default: {},
});
const formInstance = useTemplateRef<FormInstance>('form');

const rootProps = ['key', 'component', 'label'];
const getProps = (item: any) => {
  if (item.props) item.props;
  const props: any = {};
  Object.keys(item).forEach((key) => {
    if (!rootProps.includes(key)) {
      props[key] = item[key];
    }
  });
  return props;
};
const componentMap = {
  input: 'el-input',
  inputNumber: 'el-input-number',
  inputTag: 'el-input-tag',
  select: 'el-select',
  option: 'el-option',
  radioGroup: 'el-radio-group',
  checkboxGroup: 'el-checkbox-group',
  switch: 'el-switch',
  slider: 'el-slider',
  datePicker: 'el-date-picker',
  timePicker: 'el-time-picker',
  timeSelect: 'el-time-select',
  upload: 'el-upload',
  treeSelect: 'el-tree-select',
  transfer: 'el-transfer',
  rate: 'el-rate',
  colorPicker: 'el-color-picker',
  cascader: 'el-cascader',
};

const componentSubMap = {
  select: 'el-option',
  radioGroup: 'el-radio',
  checkboxGroup: 'el-checkbox',
};  
const getComponent = (item: any) => {
  if (item.component && typeof item.component !== 'string') {
    return item.component;
  }
  const component: string = item.component || 'input';
  return componentMap[component as keyof typeof componentMap];
};

const getSubComponent = (item: any) => {
  if (['select', 'radioGroup', 'checkboxGroup'].includes(item.component)) {
    return componentSubMap[item.component as keyof typeof componentSubMap];
  }
  return null;
};

const validate = () => {
  return formInstance.value?.validate();
};

defineExpose({
  validate,
});
</script>
