import Vue from 'vue';
   import Router from 'vue-router';
   import Home from './components/Home.vue';
   import ImportExport from './components/ImportExport.vue';

   Vue.use(Router);

   export default new Router({
     routes: [
       {
         path: '/',
         name: 'Home',
         component: Home
       },
       {
         path: '/import-export',
         name: 'ImportExport',
         component: ImportExport
       }
     ]
   });