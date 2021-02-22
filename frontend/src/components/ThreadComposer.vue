<template>
    <form v-on:submit.prevent="onSubmit">
        <h1>Compose new thread</h1>
        <p v-if="errorText" style="color: red">
            {{errorText}}
        </p>

        <label for="title">Title</label>
        <input type="text" id="title" v-model="title"><br/>

        <label for="text">Text</label>
        <textarea id="text" v-model="text"></textarea><br/>

        <button :disabled="doingRequest">Create thread</button>
    </form>
</template>

<script>
import {createThread} from '../apiclient';

export default {
    data: () => ({
        doingRequest: false,
        errorText: '',

        title: '',
        text: '',
    }),
    methods: {
        async onSubmit() {
            try {
                this.doingRequest = true;
                const result = await createThread(this.title, this.text);
                if (result.status === 200) {
                    this.$router.push({path: `/thread/${result.body.id}`});
                } else {
                    this.errorText = result.body.error;
                }
            }
            catch(e) {
                this.errorText = e.message;
            } finally {
                this.doingRequest = false;
            }
        }
    }
}
</script>

<style>

</style>