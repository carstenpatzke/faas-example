<template>
    <div>
        <h1>Login</h1>
        <p v-if="errorText" style="color: red">
            {{errorText}}
        </p>
        <form v-on:submit.prevent="onSubmit">
            <label for="username">Username</label>
            <input type="username" id="username" v-model="username"><br/>

            <label for="password">Password</label>
            <input type="password" id="password" v-model="password"><br/>

            <button :disabled="doingRequest">Login</button>
        </form>
    </div>
</template>

<script>
import {login} from '../apiclient';

export default {
    name: 'Login',
    data: () => ({
        doingRequest: false,
        errorText: '',

        username: '',
        password: '',
    }),
    methods: {
        async onSubmit() {
            try {
                this.doingRequest = true;
                const response = await login(this.username, this.password);
                
                if (response.status === 200) {
                    this.$router.push({path: '/'});
                } else {
                    throw new Error(response.body.error);
                }
            } catch(e) {
                this.errorText = e.message;
                this.password = '';
            } finally {
                this.doingRequest = false;
            }
        }
    }
}
</script>
