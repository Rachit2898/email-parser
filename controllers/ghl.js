import { validate } from "../util.js";

export const upsertContact = async (req) => {
  try {
    // Step 1: Upsert the contact



    const contactRes = await fetch(
      "https://services.leadconnectorhq.com/contacts/upsert",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${req.token}`,
          version: "2021-07-28",
        },
        body: JSON.stringify(req.body),
      }
    );

    const contactResult = await contactRes.json();
    console.log(contactResult.contact.customFields)
    if (!contactResult.succeded) {
      console.error("Contact upsert failed:", contactResult);
      return;
    }

    // Step 2: Fetch pipelines
    const pipelineRes = await fetch(
      `https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${req.body.locationId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${req.token}`,
          version: "2021-07-28",
          Accept: "application/json",
        },
      }
    );

    const pipelineResult = await pipelineRes.json();
    const pipeline = pipelineResult.pipelines;

    if (!pipeline) {
      console.warn("No pipeline found.");
      return;
    }

    // Step 3: Upsert opportunity
    const opportunityPayload = {
      pipelineId: "3J9qWn4DADAVvVKwwLGF",
      locationId: req.body.locationId,
      contactId: contactResult.contact?.id,
      name: "New Lead",
      status: "open",
      pipelineStageId: "dea264ac-df1a-47e7-9b30-628b23b06e5d",
    };

    const opportunityRes = await fetch(
      "https://services.leadconnectorhq.com/opportunities/upsert",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${req.token}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(opportunityPayload),
      }
    );

    await opportunityRes.json();

    const url =
      "https://services.leadconnectorhq.com/locations/lXqUG5UDmVTUwxr7W0HQ/customFields";
    const options = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${req.token}`,
        Version: "2021-07-28",
        Accept: "application/json",
      },
    };

    try {
      const response = await fetch(url, options);
      const data = await response.json();
    } catch (error) {
      console.error(error);
    }
  } catch (error) {
    console.error("Error in upsertContact:", error);
  }
};
