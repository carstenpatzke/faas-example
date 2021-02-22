<template>
    <div>
        <div>
            <div style="display: flex; align-items: center;">
                <h1>{{thread.title}}</h1>
                <p style="margin-left: 1em;">{{formatTimestamp(thread.creationTime)}} {{thread.title}} by {{thread.username}}</p>
            </div>
            <p style="white-space: pre-line;">{{thread.text}}</p>
        </div>

        <comment-composer :threadId="thread.id" @createdNewComment="reload()" v-if="loggedInDetails"/>
        <button @click="reload()" :disabled="doingRequest">Reload 🔄</button>
        <ul v-for="comment in comments" :key="comment.id">
            <li>
                <div>{{formatTimestamp(comment.creationTime)}} by {{comment.username}}</div>
                <p>{{comment.text}}</p>
            </li>
        </ul>
    </div>
</template>

<script>
import {getThreadAndComments,loggedInDetails} from '../apiclient';
import CommentComposer from '../components/CommentComposer.vue';
import { formatTime } from '../timeFormatter';
export default {
    components: { CommentComposer },
    data: () => ({
        loggedInDetails,
        doingRequest: false,
        thread: {
            title: '',
            text: '',
            creationTime: '',
            username: '',
        },
        comments: [],
    }),
    methods: {
        async reload() {
            try {
                this.doingRequest = true;
                const response = await getThreadAndComments(this.$route.params.id);
                if (response.status === 200) {
                    this.thread = response.body.thread;
                    this.comments = response.body.comments;
                }
            } finally {
                this.doingRequest = false;
            }
        },
        formatTimestamp(timestamp) {
            return formatTime(timestamp);
        }
    },
    created() {
        this.reload();
    }
}
</script>
