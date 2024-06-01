<template>
  <div>
    <input v-model="itemDescription" placeholder="Item Description" />
    <input v-model.number="quantity" type="number" placeholder="Quantity" />
    <button @click="addItem">Add Item</button>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ItemForm',
  props: ['incidentId'],
  data() {
    return {
      itemDescription: '',
      quantity: 1
    };
  },
  methods: {
    async addItem() {
      try {
        await axios.post('http://localhost:5000/items', {
          incident_id: this.incidentId,
          item_description: this.itemDescription,
          quantity: this.quantity
        });
        this.$emit('item-added');
        this.itemDescription = '';
        this.quantity = 1;
      } catch (error) {
        console.error('Error adding item:', error);
      }
    }
  }
};
</script>
