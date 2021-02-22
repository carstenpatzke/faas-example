<template>
    <form v-on:submit.prevent="onSubmit">
        <h1>Add new comment</h1>
        <p v-if="errorText" style="color: red">
            {{errorText}}
        </p>

        <label for="text">Text</label>
        <textarea id="text" v-model="text"></textarea><br/>

        <button :disabled="doingRequest">Add comment</button>
    </form>
</template>

<script>
import {addComment} from '../apiclient';

export default {
    props: ['threadId'],
    data: () => ({
        doingRequest: false,
        errorText: '',

        text: '',
    }),
    methods: {
        async onSubmit() {
            try {
                this.doingRequest = true;
                const result = await addComment(this.threadId, this.text);
                if (result.status === 200) {
                    this.$emit('createdNewComment');
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
