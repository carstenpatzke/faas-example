<template>
    <div>
        <h2>API response time</h2>
        <table>
            <tbody>
                <tr v-for="line in lastExecutions" :key="line.index">
                    <td>{{line.index}}</td>
                    <td>{{line.method}}</td>
                    <td>{{line.path}}</td>
                    <td>{{(line.time).toFixed(1)}} ms</td>
                </tr>
            </tbody>
        </table>
        Use backend
        <button :style="currentBackend.provider == 'aws' ? 'background: green' : ''" @click="switchBackendTo('aws')">AWS</button>
        <button :style="currentBackend.provider == 'google' ? 'background: green' : ''" @click="switchBackendTo('google')">Google</button>
    </div>
</template>

<script>
import {currentBackend, lastExecutions, switchBackendTo} from '../apiclient';

export default {
    data: () => ({
        lastExecutions,
        currentBackend
    }),
    methods: {
        switchBackendTo(provider) {
            switchBackendTo(provider);
            this.$router.push({path: '/'}).catch(()=>{});
            this.$router.go(); // Page reload
        }
    }
}
</script>

<style>
h2 {
    font-size: 1em;
    font-weight: bold;
    margin: 0;
    padding: 0;
}
</style>