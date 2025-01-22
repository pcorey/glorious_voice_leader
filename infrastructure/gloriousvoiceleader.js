import {
  CloudFormationClient,
  CreateStackCommand,
  UpdateStackCommand,
} from "@aws-sdk/client-cloudformation";
import { fromSSO } from "@aws-sdk/credential-providers";
import { loadSharedConfigFiles } from "@smithy/shared-ini-file-loader";
import { parseArgs } from "node:util";
import { readFile } from "fs/promises";

let args = process.argv.slice(2);

let options = { profile: { type: "string" }, action: { type: "string" } };

let {
  values: { profile, action },
} = parseArgs({ args, options });
let awsConfig = {
  credentials: fromSSO({ profile }),
  region:
    (await loadSharedConfigFiles()).configFile[profile]?.region || "us-east-1",
};

let client = new CloudFormationClient(awsConfig);

if (action === "create") {
  let res = await client.send(
    new CreateStackCommand({
      Capabilities: ["CAPABILITY_IAM"],
      StackName: "gloriousvoiceleader",
      TemplateBody: await readFile(
        "./infrastructure/gloriousvoiceleader.template",
        "utf-8"
      ),
    })
  );

  console.log({ create: res });
}

if (action === "update") {
  let res = await client.send(
    new UpdateStackCommand({
      Capabilities: ["CAPABILITY_IAM"],
      StackName: "gloriousvoiceleader",
      TemplateBody: await readFile(
        "./infrastructure/gloriousvoiceleader.template",
        "utf-8"
      ),
    })
  );

  console.log({ update: res });
}
