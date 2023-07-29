const { Midjourney } = require("midjourney");
async function main() {
  const client = new Midjourney({
    ServerId: "1082500871478329374",
    ChannelId: "1094892992281718894",
    SalaiToken: "NDI3MDExMDQ3MjEyMzE4NzIw.G9GnL_.kkOyR3ggzboP48GI1l_NvGU-ngxSLscEhWhrac"
  })
  await client.Connect()
  const Imagine = await client.Imagine(
    "Butiful landscape on ocean with few old sailing boat who have reds sailings, 1h before sunrise, with few littles clouds, shot flush with the water, realistic, 8k",
    (uri, progress) => {
      console.log("Imagine.loading", uri, "progress", progress)
    }
  )
  console.log(Imagine)
  client.Close()
  return Imagine.content
}

main()
