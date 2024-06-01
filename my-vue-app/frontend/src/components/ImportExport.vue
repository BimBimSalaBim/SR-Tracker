<template>
  <div class="import-export">
    <h4>Import/Export</h4>
    <div>
      <button @click="exportData" class="btn">Export</button>
      <input type="file" @change="importData" class="btn" />
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  methods: {
    exportData() {
      axios.get('http://localhost:5000/export')
        .then(response => {
          const dataStr = JSON.stringify(response.data);
          const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

          const exportFileDefaultName = 'data.json';

          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', exportFileDefaultName);
          linkElement.click();
        })
        .catch(error => {
          console.error('Error exporting data:', error);
        });
    },
    importData(event) {
      const file = event.target.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const jsonData = JSON.parse(e.target.result);

        axios.post('http://localhost:5000/import', jsonData)
          .then(() => {
            console.log('Data imported successfully');
          })
          .catch(error => {
            console.error('Error importing data:', error);
          });
      };

      reader.readAsText(file);
    }
  }
};
</script>

<style scoped>
/* Add your styles here */
</style>
