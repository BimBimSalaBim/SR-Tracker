<template>
  <div class="upload-form-wrapper">
    <input type="file" id="file" @change="handleFileUpload" />
    <label for="file" class="btn waves-effect waves-light" style="background: #04486b !important;">Upload CSV</label>
  </div>
</template>

<script>
export default {
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.$emit('file-uploaded', file);
      }
    }
  }
}
</script>

<style scoped>
.upload-form-wrapper {
  display: flex;
  align-items: center;
}

.upload-form-wrapper input[type="file"] {
  display: none;
}

.upload-form-wrapper label {
  background-color: #398dd2;
  color: white;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
}

.upload-form-wrapper label:hover {
  background-color: #336699;
}
</style>