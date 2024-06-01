<template>
  <div>
    <div id="add-item-modal" class="modal">
      <div class="modal-content">
        <h4>Add Item</h4>
        <div class="input-field">
          <input id="item-description" type="text" v-model="itemDescription" @input="activateLabel('item-description')" @focus="activateLabel('item-description')" @blur="deactivateLabel('item-description')">
          <label for="item-description" :class="{ active: itemDescription }">Item Description</label>
        </div>
        <div class="input-field">
          <input id="item-quantity" type="number" v-model="itemQuantity" @input="activateLabel('item-quantity')" @focus="activateLabel('item-quantity')" @blur="deactivateLabel('item-quantity')">
          <label for="item-quantity" :class="{ active: itemQuantity }">Quantity</label>
        </div>
      </div>
      <div class="modal-footer">
        <a href="#" class="modal-close waves-effect waves-green btn-flat">Close</a>
        <a href="#" class="waves-effect waves-green btn-flat" @click="addItem">Add Item</a>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import 'materialize-css/dist/js/materialize.min.js';

export default {
  name: 'AddItemForm',
  props: {
    incidentId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      itemDescription: '',
      itemQuantity: 1,
      localIncidentId: this.incidentId,
    };
  },
  watch: {
    incidentId(newVal) {
      this.localIncidentId = newVal;
    }
  },
  methods: {
    open(incidentId) {
      this.localIncidentId = incidentId;
      const elem = document.getElementById('add-item-modal');
      const instance = M.Modal.init(elem);
      instance.open();
      // Ensure labels are correctly active when the modal opens
      this.activateLabel('item-description');
      this.activateLabel('item-quantity');
    },
    addItem() {
      const newItem = {
        incident_id: this.localIncidentId,
        item_description: this.itemDescription,
        quantity: this.itemQuantity,
      };
      axios.post('http://localhost:5000/items', newItem)
        .then(() => {
          this.$emit('item-added');
          this.itemDescription = '';
          this.itemQuantity = 1;
          M.toast({ html: 'Item added successfully!' });
          this.closeModal();
        })
        .catch((error) => {
          console.error('Error adding item:', error);
        });
    },
    closeModal() {
      const elem = document.getElementById('add-item-modal');
      const instance = M.Modal.getInstance(elem);
      instance.close();
    },
    activateLabel(inputId) {
      const label = document.querySelector(`label[for=${inputId}]`);
      if (label) {
        label.classList.add('active');
      }
    },
    deactivateLabel(inputId) {
      const value = this[inputId.replace('-', '_')];
      const label = document.querySelector(`label[for=${inputId}]`);
      if (label && !value) {
        label.classList.remove('active');
      }
    },
  },
  mounted() {
    document.addEventListener('DOMContentLoaded', () => {
      const elems = document.querySelectorAll('.modal');
      M.Modal.init(elems);
    });
  },
  updated() {
    const elems = document.querySelectorAll('.modal');
    M.Modal.init(elems);
  },
};
</script>

<style scoped>
@import 'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0-beta/css/materialize.min.css';

.modal {
  max-height: 75%;
}
</style>