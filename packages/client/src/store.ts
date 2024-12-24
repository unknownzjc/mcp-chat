import conf from 'conf'

const schema = {
    servers: {
        type: 'array',
        default: []
    }
}
const store = new conf({
    projectName: 'mcpchat',
    schema
})

export default store