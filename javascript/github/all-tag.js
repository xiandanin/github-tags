Vue.component('all-tag', {
    props: ['tags', 'dialogVisible', "loading"],
    template: '<el-dialog title="所有标签" :visible.sync="dialogVisible" width="85%" top="10vh" center append-to-body><div v-loading="loading" style="min-height: 500px"><template v-for="item in tags"><h4>{{item.letter}}</h4><div style="display: block;margin-bottom: 10px"><template v-for="tag in item.tags"><el-tag :key="tag" type="success" size="small" :disable-transitions="false"                            @click.native="handleClickTag(tag)">                        {{tag}}</el-tag></template></div></template></div></el-dialog>',
    data: {}, methods: {
        handleClickTag(tag) {
            document.getElementById("search_input").value = tag
            document.getElementById("search_by_tag").click()
            this.dialogVisible = false
        }
    }
});

