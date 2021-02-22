<template>
    <div id="app">
        <api-debug class="apidebug" />
        <header>
            <router-link to="/">Home</router-link>
            <template v-if="loggedInDetails.username"> | Logged in as {{loggedInDetails.username}} | <button @click="logout">logout</button></template>
            <template v-else> | <router-link to="/login">Login</router-link> | <router-link to="/register">Register</router-link></template>
        </header>
        <main>
            <router-view />
        </main>
    </div>
</template>

<script>
import { loggedInDetails } from './apiclient';
import ApiDebug from './components/ApiDebug';
import {logout} from './apiclient';

export default {
    components: {
        ApiDebug,
    },
    data: () => ({
        loggedInDetails,
    }),
    methods: {
        logout() {
            logout();
        }
    }
}
</script>

<style>
#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
}

.apidebug {
    position: absolute;
    right: 0px;
    padding: 0.1em;
    background: #bcbcbc;
}
</style>
