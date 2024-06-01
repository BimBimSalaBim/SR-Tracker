<template>
  <div id="app">
    <nav>
      <div class="nav-wrapper">
        <a href="#" class="brand-logo center">SR Tracker</a>
        <a href="#" data-target="slide-out" class="sidenav-trigger btn-floating btn-large teal lighten-1"><i class="material-icons">menu</i></a>
        <ul id="nav-mobile" class="right hide-on-med-and-down">
          <li>
            <UploadForm @file-uploaded="handleFileUpload" />
          </li>
          <li>
            <button class="btn waves-effect waves-light" @click="exportData">Export</button>
          </li>
          <li>
            <input type="file" id="import-file" @change="importData" style="display: none;" />
            <label for="import-file" class="btn waves-effect waves-light">Import</label>
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
    <ul id="slide-out" class="sidenav teal lighten-1">
      <!-- Add any side navigation links here -->
    </ul>

    <div class="row">
      <div class="col s1">
        <center>incident_id</center>
      </div>
      <div class="col s2">
        <center>customer_name</center>
      </div>
      <div class="col s2">
        <center>on_behalf_of</center>
      </div>
      <div class="col s2">
        <center>customer_division</center>
      </div>
      <div class="col s5">
        <center>description</center>
      </div>
    </div>
    <ul class="collapsible">
      <li v-for="sr in filteredSrs" :key="sr.incident_id">
        <div :class="['collapsible-header', headerClass(sr.items)]">
          <div class="row">
            <div class="col s1">
              <center>{{ sr.incident_id }}</center>
            </div>
            <div class="col s2">
              <center>{{ sr.customer_name }}</center>
            </div>
            <div class="col s2">
              <center>{{ sr.on_behalf_of }}</center>
            </div>
            <div class="col s2">
              <center>{{ abbreviateDivision(sr.customer_division) }}</center>
            </div>
            <div class="col s4">
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
                <label>
                  <input type="checkbox" :checked="item.status === 'Here'" @change="updateItemStatus(item)" />
                  <span>Here</span>
                </label>
              </div>
            </li>
          </ul>
          <div class="row">
            <div class="col s12 right-align">
              <button class="btn waves-effect waves-light" @click="toggleAddItemForm(sr.incident_id)">Add Item</button>
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
              <button class="btn waves-effect waves-light" @click="toggleScheduleForm(sr.incident_id)">Schedule Appointment</button>
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
        "GEOTECHNICAL & MATERIALS ENGINEERING DIVISION": "GMED"
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
        this.srs = response.data.sort((a, b) => a.incident_id - b.incident_id);
      } catch (error) {
        console.error('Error fetching SRs:', error);
      }
    },
    handleFileUpload(file) {
      const formData = new FormData();
      formData.append('file', file);

      axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then(() => {
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
    headerClass(items) {
      if (items.length === 0) {
        return 'no-items';
      }
      return this.areAllItemsHere(items) ? 'all-items-here' : '';
    },
    abbreviateDivision(division) {
      return this.divisionAbbreviations[division] || division;
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
      M.Collapsible.init(elems);

      const sidenavElems = document.querySelectorAll('.sidenav');
      M.Sidenav.init(sidenavElems);
    });
  },
  updated() {
    const elems = document.querySelectorAll('.collapsible');
    M.Collapsible.init(elems);
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
}
.btn {
  background-color: #398dd2 !important;
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
  background-color: white !important;
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
</style>