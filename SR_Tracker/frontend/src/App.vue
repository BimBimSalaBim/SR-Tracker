<template>
  <div :class="{'dark-mode': isDarkMode}" style="height: 100vh;" id="app">
    <nav>
      <div class="nav-wrapper">
        <button data-target="slide-out" class="sidenav-trigger" :style="{ backgroundColor: isDarkMode ? '#1f1f1f !important' : '#398dd2 !important', border:'0px',padding: '1px' }">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" class="icon-xl-heavy">
            <path fill="currentColor" fill-rule="evenodd" d="M8.857 3h6.286c1.084 0 1.958 0 2.666.058.729.06 1.369.185 1.961.487a5 5 0 0 1 2.185 2.185c.302.592.428 1.233.487 1.961.058.708.058 1.582.058 2.666v3.286c0 1.084 0 1.958-.058 2.666-.06.729-.185 1.369-.487 1.961a5 5 0 0 1-2.185 2.185c-.592.302-1.232.428-1.961.487C17.1 21 16.227 21 15.143 21H8.857c-1.084 0-1.958 0-2.666-.058-.728-.06-1.369-.185-1.96-.487a5 5 0 0 1-2.186-2.185c-.302-.592-.428-1.232-.487-1.961C1.5 15.6 1.5 14.727 1.5 13.643v-3.286c0-1.084 0-1.958.058-2.666.06-.728.185-1.369.487-1.96A5 5 0 0 1 4.23 3.544c.592-.302 1.233-.428 1.961-.487C6.9 3 7.773 3 8.857 3M6.354 5.051c-.605.05-.953.142-1.216.276a3 3 0 0 0-1.311 1.311c-.134.263-.226.611-.276 1.216-.05.617-.051 1.41-.051 2.546v3.2c0 1.137 0 1.929.051 2.546.05.605.142.953.276 1.216a3 3 0 0 0 1.311 1.311c.263.134.611.226 1.216.276.617.05 1.41.051 2.546.051h.6V5h-.6c-1.137 0-1.929 0-2.546.051M11.5 5v14h3.6c1.137 0 1.929 0 2.546-.051.605-.05.953-.142 1.216-.276a3 3 0 0 0 1.311-1.311c.134-.263.226-.611.276-1.216.05-.617.051-1.41.051-2.546v-3.2c0-1.137 0-1.929-.051-2.546-.05-.605-.142-.953-.276-1.216a3 3 0 0 0-1.311-1.311c-.263-.134-.611-.226-1.216-.276C17.029 5.001 16.236 5 15.1 5zM5 8.5a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1M5 12a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1" clip-rule="evenodd"></path>
          </svg>
        </button>
        <a href="#" class="brand-logo center">SR Tracker</a>
        <ul id="nav-mobile" class="right">
          <li>
            <UploadForm @file-uploaded="handleFileUpload" />
          </li>
        </ul>
      </div>
    </nav>
    <div class="container">
      <div class="search-bar">
        <input type="text" v-model="searchQuery" placeholder="Search by incident ID, customer name, or division" />
      </div>
      <router-view />
    </div>

    <!-- Side Navigation -->
    <ul id="slide-out" class="sidenav" :style="{ backgroundColor: isDarkMode ? '#1f1f1f !important' : 'white !important', padding: '1px' }">
      <li :style="{ backgroundColor: isDarkMode ? '#1f1f1f !important' : '#398dd2 !important', padding: '1px' }">
        <h3 class="center-align white-text">Settings</h3>
      </li>
      <br/>
      <li class="center-align">
        <button class="btn waves-effect waves-light" style="width: 80%;" @click="exportData">Export</button>
      </li>
      <li class="center-align">
        <input type="file" id="import-file" style="width: 80%; display: none;" @change="importData" />
        <label for="import-file" style="width: 80%;" class="btn waves-effect waves-light">Import</label>
      </li>
      <li class="center-align">
        <button class="btn waves-effect waves-light" style="width: 80%;" @click="autoGenerateWithAIForAll">Auto Generate with AI for All</button>
      </li>
      <li class="center-align">
        <button class="btn waves-effect waves-light" style="width: 80%;" @click="exportChecklist">Export Checklist</button>
      </li>
      <li class="center-align">
        <button class="btn waves-effect waves-light" style="width: 80%;" @click="toggleViewArchived">{{ showArchived ? 'View Active Requests' : 'View Archived Requests' }}</button>
      </li>
      <li class="center-align">
        <button class="btn waves-effect waves-light" style="width: 80%;" @click="toggleDarkMode">{{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}</button>
      </li>
    </ul>

    <div class="row">
      <div class="col s1">
        <center>incident_id</center>
      </div>
      <div class="col s1">
        <center>customer_name</center>
      </div>
      <div class="col s2">
        <center>on_behalf_of</center>
      </div>
      <div class="col s2">
        <center>customer_location</center>
      </div>
      <div class="col s1">
        <center>customer_division</center>
      </div>
      <div class="col s4">
        <center>description</center>
      </div>
      <div class="col s1">
      </div>
    </div>
    <ul class="collapsible">
      <li v-for="sr in filteredSrs" :key="sr.incident_id">
        <div :class="['collapsible-header', headerClass(sr.items)]">
          <div class="row">
            <div class="col s1">
              <center>{{ sr.incident_id }}</center>
            </div>
            <div class="col s1">
              <center>{{ sr.customer_name }}</center>
            </div>
            <div class="col s2">
              <center>
                <input type="text" v-model="sr.on_behalf_of" @blur="updateOnBehalfOf(sr)" />
              </center>
            </div>
            <div class="col s2">
              <center><input type="text" v-model="sr.location" @blur="updateLocation(sr)" /></center>
            </div>
            <div class="col s1">
              <center>{{ abbreviateDivision(sr.customer_division) }}</center>
            </div>
            <div :class="descriptionClass(sr)">
              <center>{{ sr.description }}</center>
            </div>
            <div class="col s1" v-if="sr.appointments && sr.appointments.length > 0">
              <i class="material-icons">event_available</i>
            </div>
          </div>
        </div>
        <div class="collapsible-body">
          <ul>
            <li v-for="(item, index) in sr.items" :key="item.id" class="item">
              <div class="item-content">
                <div class="item-number">{{ index + 1 }}</div>
                <div class="item-description">
                  {{ item.item_description }} - Quantity: {{ item.quantity }}
                </div>
                <label style="padding: 1%;">
                  <input  type="checkbox" :checked="item.status === 'Here'" @change="updateItemStatus(item)" />
                  <span>Here</span>
                </label>
                <button class="btn-small red" @click="removeItem(item.id)">Remove</button>
              </div>
            </li>
          </ul>
          <div class="row">
            <div class="col s12 right-align">
              <button class="btn waves-effect waves-light" style="margin:5px;" @click="toggleAddItemForm(sr.incident_id)">Add Item</button>
              <button class="btn waves-effect waves-light" style="margin:5px;" @click="autoPopulateUsingAI(sr.incident_id)">Auto Populate using AI</button>
            </div>
            <div class="col s12 right-align">
              <button class="btn waves-effect waves-light" style="margin: 5px;" @click="generateEmail(sr)">Generate Email</button>
              <button class="btn waves-effect waves-light red" style="margin: 5px;" @click="archiveRequest(sr.incident_id)">Archive</button>
            </div>
          </div>
          <div v-if="showForm && currentIncidentId === sr.incident_id" class="row add-item-form">
            <div class="col s10">
              <input v-model="newItemDescription" placeholder="Item Description" />
              <input v-model="newItemQuantity" type="number" placeholder="Quantity" />
            </div>
            <div class="col s2">
              <button class="btn waves-effect waves-light" @click="addItem(sr.incident_id)">Add Item</button>
            </div>
          </div>
          <div class="row">
            <div class="col s12 right-align">
              <button class="btn waves-effect waves-light" style="margin: 5px;" @click="toggleScheduleForm(sr.incident_id)" v-if="sr.appointments && sr.appointments.length == 0">Schedule Appointment</button>
            </div>
          </div>
          <div v-if="showScheduleForm && currentIncidentId === sr.incident_id" class="row schedule-form">
            <div class="col s10">
              <input type="date" v-model="newAppointmentDate" placeholder="Date" />
              <input type="time" v-model="newAppointmentTime" placeholder="Time" />
            </div>
            <div class="col s2">
              <button class="btn waves-effect waves-light" @click="scheduleAppointment(sr.incident_id)">Schedule</button>
            </div>
          </div>
          <div v-if="sr.appointments && sr.appointments.length > 0" class="appointments">
            <h5>Scheduled Appointments:</h5>
            <ul>
              <li v-for="appointment in sr.appointments" :key="appointment.id">
                {{ appointment.date }} at {{ appointment.time }}
              </li>
            </ul>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios';
import UploadForm from './components/UploadForm.vue';
import 'materialize-css/dist/js/materialize.min.js';

export default {
  name: 'App',
  components: {
    UploadForm,
  },
  data() {
    return {
      srs: [],
      showForm: false,
      showScheduleForm: false,
      currentIncidentId: '',
      newItemDescription: '',
      newItemQuantity: 1,
      newAppointmentDate: '',
      newAppointmentTime: '',
      searchQuery: '',
      showArchived: false, 
      isDarkMode: localStorage.getItem('isDarkMode') === 'true', 
      divisionAbbreviations: {
        "Survey & Mapping & Property Division": "SMPD",
        "WATERWORKS DIVISION": "WWD",
        "STORMWATER QUALITY DIVISION": "SWQD",
        "BUILDING & SAFETY DIVISION": "BSD",
        "SEWER MAINTENANCE DIVISION - ADMINISTRATION": "SMD",
        "SEWER MAINTENANCE DIVISION": "SMD",
        "ROAD MAINTENANCE DIVISION": "RMD",
        "LAND DEVELOPMENT DIVISION": "LDD",
        "HUMAN RESOURCES DIVISION": "HRD",
        "GEOTECHNICAL & MATERIALS ENGINEERING DIVISION": "GMED",
        "STORMWATER MAINTENANCE DIVISION": "SWMD"
      }
    };
  },
  created() {
    this.fetchSrs();
  },
  methods: {
    async fetchSrs() {
      try {
        const response = await axios.get('http://localhost:5000/srs');
        this.srs = response.data
          .filter(sr => this.showArchived ? sr.archived === 1 : sr.archived === 0)
          .sort((a, b) => a.incident_id - b.incident_id);
      } catch (error) {
        console.error('Error fetching SRs:', error);
      }
    },
    handleFileUpload(fileData) {
      axios.post('http://localhost:5000/upload', {
        name: fileData.name,
        type: fileData.type,
        content: fileData.content
      }).then(response => {
        console.log('Parsed data:', response.data.data);
        this.fetchSrs();
      }).catch(error => {
        console.error('Error uploading file:', error);
      });
    },
    async exportData() {
      try {
        const response = await axios.get('http://localhost:5000/export');
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(response.data));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "srs_data.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      } catch (error) {
        console.error('Error exporting data:', error);
      }
    },
    async importData(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target.result;
          const data = JSON.parse(content);
          await axios.post('http://localhost:5000/import', data);
          this.fetchSrs();
        } catch (error) {
          console.error('Error importing data:', error);
        }
      };
      reader.readAsText(file);
    },
    async autoPopulateUsingAI(requestId) {
      try {
        const response = await axios.post('http://localhost:5000/api/auto-populate-ai', { requestId });
        console.log(response.data);
        await this.fetchSrs();
      } catch (error) {
        console.error("Error auto-populating using AI:", error);
      }
    },
    async archiveRequest(incidentId) {
      try {
        await axios.post(`http://localhost:5000/srs/${incidentId}/archive`);
        this.fetchSrs();
      } catch (error) {
        console.error('Error archiving request:', error);
      }
    },
    toggleViewArchived() {
      this.showArchived = !this.showArchived;
      this.fetchSrs();
    },
    toggleDarkMode() { // Add this method to toggle dark mode
      this.isDarkMode = !this.isDarkMode;
      localStorage.setItem('isDarkMode', this.isDarkMode);
    },
    async autoGenerateWithAIForAll() {
      try {
        const filteredSrs = this.srs.filter(sr => !sr.items || sr.items.length === 0);
        for (const sr of filteredSrs) {
          await this.autoPopulateUsingAI(sr.incident_id);
        }
      } catch (error) {
        console.error("Error auto-generating using AI for all:", error);
      }
    },
    descriptionClass(sr) {
      // If there are appointments, the description column will be smaller
      let remainingCols = sr.appointments && sr.appointments.length > 0 ? 4 : 5;
      return `col s${remainingCols}`;
    },
    updateItemStatus(item) {
      const status = item.status === 'Here' ? 'Not Here' : 'Here';
      axios.post(`http://localhost:5000/items/${item.id}`, { status }).then(() => {
        this.fetchSrs();
      });
    },
    toggleAddItemForm(incidentId) {
      this.currentIncidentId = incidentId;
      this.showForm = !this.showForm;
    },
    async addItem(incidentId) {
      if (this.newItemDescription && this.newItemQuantity > 0) {
        try {
          await axios.post('http://localhost:5000/items', {
            incident_id: incidentId,
            item_description: this.newItemDescription,
            quantity: this.newItemQuantity,
          });
          this.newItemDescription = '';
          this.newItemQuantity = 1;
          this.showForm = false;
          this.fetchSrs();
        } catch (error) {
          console.error('Error adding item:', error);
        }
      }
    },
    async updateOnBehalfOf(sr) {
      try {
        await axios.post(`http://localhost:5000/srs/${sr.incident_id}/update`, {
          on_behalf_of: sr.on_behalf_of
        });
        this.fetchSrs();
      } catch (error) {
        console.error('Error updating on_behalf_of:', error);
      }
    },
    async updateLocation(sr) {
      try {
        await axios.post(`http://localhost:5000/srs/${sr.incident_id}/update`, {
          location: sr.location
        });
        this.fetchSrs();
      } catch (error) {
        console.error('Error updating location:', error);
      }
    },
    async removeItem(itemId) {
      try {
        await axios.delete(`http://localhost:5000/items/${itemId}`);
        this.fetchSrs();
      } catch (error) {
        console.error('Error removing item:', error);
      }
    },
    toggleScheduleForm(incidentId) {
      this.currentIncidentId = incidentId;
      this.showScheduleForm = !this.showScheduleForm;
    },
    async scheduleAppointment(incidentId) {
      if (this.newAppointmentDate && this.newAppointmentTime) {
        try {
          await axios.post('http://localhost:5000/appointments', {
            incident_id: incidentId,
            date: this.newAppointmentDate,
            time: this.newAppointmentTime,
          });
          this.newAppointmentDate = '';
          this.newAppointmentTime = '';
          this.showScheduleForm = false;
          this.fetchSrs();
        } catch (error) {
          console.error('Error scheduling appointment:', error);
        }
      }
    },
    areAllItemsHere(items) {
      return items.length > 0 && items.every(item => item.status === 'Here');
    },
    hasSomeItemsHere(items) {
      return items.length > 0 && items.some(item => item.status === 'Here') && items.some(item => item.status !== 'Here');
    },
    headerClass(items) {
      if (items.length === 0) {
        return 'no-items';
      } else if (this.areAllItemsHere(items)) {
        return 'all-items-here';
      } else if (this.hasSomeItemsHere(items)) {
        return 'some-items-here';
      }
      return '';
    },
    abbreviateDivision(division) {
      return this.divisionAbbreviations[division] || division;
    },
    async exportChecklist() {
      try {
        const checklistData = this.srs
          .filter(sr => sr.items.some(item => item.status !== 'Here'))
          .map(sr => ({
            incident_id: sr.incident_id,
            customer_name: sr.customer_name,
            items: sr.items.filter(item => item.status !== 'Here')
          }));

        let checklistHtml = `
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            h3 { color: #398dd2; }
            ul { list-style-type: none; padding: 0; }
            li { margin-bottom: 10px; }
            .incident { margin-bottom: 20px; }
            .item { margin-left: 20px; }
          </style>
        </head>
        <body>
          <h1 style="text-align: center;" >Checklist of Items Not Here</h1>`;

        checklistData.forEach(sr => {
          checklistHtml += `
          <div class="incident">
            <h3>Incident ID: ${sr.incident_id} - ${sr.customer_name}</h2>
            <ul>`;
          sr.items.forEach(item => {
            checklistHtml += `<li class="item"> <input type="checkbox" /> ${item.item_description} - Quantity: ${item.quantity}</li>`;
          });
          checklistHtml += `</ul></div>`;
        });

        checklistHtml += `
        </body>
        </html>`;

        const blob = new Blob([checklistHtml], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", url);
        downloadAnchorNode.setAttribute("download", "checklist.html");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      } catch (error) {
        console.error('Error exporting checklist:', error);
      }
    },  getFirstName(name, type) {
    if (!name) return '';
    // Check if the name is in "Last, First" format
    if (name.includes(',')) {
      if (type === 'first') {
        return name.split(',')[1].trim();
      } else if (type === 'last') {
        return name.split(',')[0].trim();
      }
    } else {
      // Otherwise, assume it's in "First Last" or "Last First" format
      const nameParts = name.split(' ');
      if (type === 'first') {
        return nameParts[0];
      } else if (type === 'last') {
        return nameParts[nameParts.length - 1];
      }
    }
  },
    generateEmail(sr) {
       

      const recipient = this.getFirstName(sr.on_behalf_of, 'first') || this.getFirstName(sr.customer_name, 'last');
      let emailBody = "Hello ";

      emailBody += recipient + ",\n\n";

      emailBody += `All the items for Service Request #${sr.incident_id} have been received by inventory. I would like to schedule the delivery/install at your earliest convenience. Please let me know the best time to proceed.\n\n`;

      sr.items.forEach(item => {
        if (item.item_description.toLowerCase().includes("sit stand")) {
          emailBody += "Note: The setup for sit/stand desks can take up to an hour.\n";
        } else if (item.item_description.toLowerCase().includes("monitor arm")) {
          emailBody += "Note: The setup for monitor arms can take around 40 minutes.\n";
        }
      });
      emailBody += `Please note that the delivery/install does not require your presence and can be done on a day you are teleworking or on Friday.\n\n`;

      emailBody += `Also, please verify if you are located at ${sr.location}.\n\nThank you.\n\n`;

      // Create a mailto link
      const mailtoLink = `mailto:?subject=Service Request ${sr.incident_id} Delivery/Install&body=${encodeURIComponent(emailBody)}`;

      // Open the mailto link
      window.location.href = mailtoLink;
    }
  },
  computed: {
    filteredSrs() {
      const query = this.searchQuery.toLowerCase();
      let filtered = this.srs.filter(sr => {
        return (
          (sr.incident_id && sr.incident_id.toLowerCase().includes(query)) ||
          (sr.customer_name && sr.customer_name.toLowerCase().includes(query)) ||
          (sr.customer_division && sr.customer_division.toLowerCase().includes(query)) ||
          (sr.on_behalf_of && sr.on_behalf_of.toLowerCase().includes(query))
        );
      });

      if (!isNaN(query) && query) {
        filtered = filtered.sort((a, b) => a.incident_id - b.incident_id);
      }

      return filtered;
    }
  },
  mounted() {
    document.addEventListener('DOMContentLoaded', () => {
      const elems = document.querySelectorAll('.collapsible');
      window.M.Collapsible.init(elems);

      const sidenavElems = document.querySelectorAll('.sidenav');
      window.M.Sidenav.init(sidenavElems);
    });
  },
  updated() {
    const elems = document.querySelectorAll('.collapsible');
    window.M.Collapsible.init(elems);
  },
};
</script>

<style>
@import 'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-beta/css/materialize.min.css';

.item {
  background-color: #398dd2;
  border-radius: 8px;
  margin-bottom: 10px;
  padding: 10px;
}
nav {
  background-color: #398dd2 !important;
}
button {
  background-color: #398dd2 !important;
  color: white !important;
}
.btn {
  background-color: #398dd2 !important;
  color: white !important;
}
.item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.item-number {
  font-weight: bold;
  margin-right: 10px;
}

.item-description {
  flex: 1;
  text-align: center;
}

.add-item-form, .schedule-form {
  border-radius: 8px;
  padding: 10px;
}

.all-items-here {
  background-color: lightgreen !important;
}

.no-items {
  background-color: #fabcc2 !important;
}

.some-items-here {
  background-color: rgb(254, 239, 203) !important;
}

.upload-form-wrapper {
  display: flex;
  align-items: center;
  margin-right: 15px;
}

.upload-form-wrapper input[type="file"] {
  display: none;
}

.upload-form-wrapper label {
  background-color: #ffffff;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
}

.upload-form-wrapper label:hover {
  background-color: #f0f0f0;
}

.search-bar {
  margin: 20px 0;
}

.search-bar input {
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.appointments {
  margin-top: 20px;
}

.appointments h5 {
  margin-bottom: 10px;
}

/* Add dark mode styles */
.dark-mode {
  background-color: #121212;
  color: #e0e0e0;
}

.dark-mode nav {
  background-color: #1f1f1f !important;
}

.dark-mode .btn {
  background-color: #2c2c2c !important;
}

.dark-mode .collapsible-header {
  background-color: #2c2c2c !important;
  color: #e0e0e0 !important;
}

.dark-mode .item {
  background-color: #2c2c2c !important;
}

.dark-mode input,
.dark-mode .upload-form-wrapper label {
  background-color: #333 !important;
  color: #e0e0e0 !important;
}

.dark-mode .collapsible-body {
  background-color: #1f1f1f !important;
}

.dark-mode .all-items-here {
  background-color: darkgreen !important;
}

.dark-mode .no-items {
  background-color: darkred !important;
}

.dark-mode .some-items-here {
  background-color: darkorange !important;
}
</style>
