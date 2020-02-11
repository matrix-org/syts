import axios from "axios";

async function doit() {
    const res = await axios.get("https://api.github.com/orgs/axios");
    console.log(res.data);
}

doit();
