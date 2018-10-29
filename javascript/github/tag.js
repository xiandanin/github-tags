Vue.component('tag-group', {
    props: ['tags'],
    template: '<div><template v-for=\"tag in tags\"><el-tag                :key=\"tag\"                type=\"success\"                size=\"small\"                :closable=\"editEnable\"                :disable-transitions=\"false\"                @close=\"handleClose(tag)\"                @click.native=\"handleClickTag(tag)\"        >            {{tag}}</el-tag></template><el-input            class=\"input-new-tag\"            v-show=\"editEnable&&inputVisible\"            v-model=\"inputValue\"            ref=\"saveTagInput\"            size=\"mini\"            @keyup.enter.native=\"handleInputConfirm\"            @blur=\"handleInputConfirm\"    ></el-input><el-button v-show=\"editEnable&&!inputVisible\" class=\"button-new-tag\" size=\"small\" @click=\"showInput\">+ 标签</el-button></div>',
    data: function () {
        return {
            inputVisible: false,
            inputValue: '',
            editEnable: false
        };
    },
    mounted: function () {
        this.editEnable = this.tags.length <= 0;
    }, methods: {
        handleClickTag(tag) {
            this.handleSwitchEdit()
        },
        handleClose(tag) {
            this.tags.splice(this.tags.indexOf(tag), 1);
            this.$emit('change', this.tags)
        },

        showInput() {
            this.inputVisible = true;
            this.$nextTick(_ => {
                this.$refs.saveTagInput.$refs.input.focus();
            });
        },

        handleInputConfirm() {
            let inputValue = this.inputValue;
            if (inputValue) {
                this.tags.push(inputValue);
            }
            this.inputVisible = false;
            this.inputValue = '';
            this.$emit('change', this.tags)
        },

        handleSwitchEdit() {
            this.editEnable = !this.editEnable
        }
    }
});

