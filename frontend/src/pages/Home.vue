<template>
    <div style="display: flex; flex-direction: column;">
        <div style="display: flex; flex-direction: column; border: 2px solid black;" v-if="isLoggedIn">
            <button @click="composeIsOpen = !composeIsOpen">Compose new one {{composeIsOpen ? '-' : '+'}}</button>
            <thread-composer v-if="composeIsOpen" />
        </div>
        <h1>Current threads</h1> <button @click="reload()" :disabled="doingRequest">Reload 🔄</button>
        <ul>
            <li v-for="thread in threads" :key="thread.id">
                {{formatTimestamp(thread.creationTime)}} <router-link :to="`/thread/${thread.id}`">{{thread.title}}</router-link> by {{thread.username}}
            </li>
        </ul>
    </div>
</template>

<script>
import {getThreads, loggedInDetails} from '../apiclient';
import {formatTime} from '../timeFormatter';

import ThreadComposer from '../components/ThreadComposer.vue';
export default {
    components: { ThreadComposer },
    computed: {
        isLoggedIn() {
            return !!this.loggedInDetails.username;
        }
    },
    data: () => ({
        loggedInDetails,
        doingRequest: false,
        composeIsOpen: false,
        threads: [],
    }),
    methods: {
        async reload() {
        try {
            this.doingRequest = true;
            const response = await getThreads();
            if (response.status === 200) {
                this.threads = response.body.threads;
            }
        }
        finally {
            this.doingRequest = false;
        }
    },
    formatTimestamp(timestamp) {
        formatTime(timestamp);
    }
  },
  created() {
        this.reload();
  }
}
</script>
