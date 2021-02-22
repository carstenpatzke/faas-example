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
    </div>
</template>

<script>
import {lastExecutions} from '../apiclient';

export default {
    data: () => ({
        lastExecutions,
    }),
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