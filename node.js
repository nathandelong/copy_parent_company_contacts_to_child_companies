const hubspot = require('@hubspot/api-client');

exports.main = async (event, callback) => {

  //Created by Nathan De Long @ HubSpot, 1/14/2023
  //This code is provided as-is, please test this code prior to using it in a live workflow in your environment.

  const hubspotClient = new hubspot.Client({
    accessToken: process.env.hstoken
  });
  
  try{
  //get the associated contacts for the parent company. note, trigger for this workflow is companies where number of child companies is greater than 0
  
  const hs_object_id = event.inputFields['hs_object_id'];
  //first, reach out to the associations API to get the contacts associated with the parent company. 
  const apiResponse = await hubspotClient
              .apiRequest({
              method: 'GET',
              path: `/crm/v4/objects/company/${hs_object_id}/associations/contact`,
              body: {}
            });
  //show the contacts associated with the parent company in the console
  console.log(JSON.stringify(apiResponse.body, null, 2));
  //put the IDs for the associated contacts into an array
  var associatedContactIDs = apiResponse.body.results.map(resultItem => resultItem.toObjectId);
  //log to the console for debugging
  console.log(associatedContactIDs);
  
  //get the child companies associated with the parent company
  const apiResponse2 = await hubspotClient.crm.companies.associationsApi.getAll(event.object.objectId, "company");
  //show the child companies associated with the parent company in the console
  console.log(JSON.stringify(apiResponse2.body, null, 2));
  //put the IDs for the associated child companies into an array
  var associatedCompanyIDs = apiResponse2.body.results.map(resultItem => resultItem.id);
  //log to the console for debugging
  console.log(associatedCompanyIDs);
  
  //match each contact ID to each child company ID
  let inputs = [];
  for (let i = 0; i < associatedContactIDs.length; i++) {
      for (let j = 0; j < associatedCompanyIDs.length; j++) {
          let input = {
              from: {
                  id: associatedContactIDs[i].toString()
              },
              to: {
                  id: associatedCompanyIDs[j]
              },
              type: "contact_to_company_unlabeled" //the association type can either be unlabeled or a custom association type you have in your portal
          };
          inputs.push(input);
      }
  }
  
  //wrap the output so it is formatted correctly for submission to the batch associations API  
  let output = { inputs };
  //log the output to the console for debugging
  console.log(output);
  
  //convert the output to JSON
  const BatchInputPublicAssociation = JSON.stringify(output,null, 2);
  //log the input we're going to send to the API to the console for debugging
  console.log(BatchInputPublicAssociation)
  const fromObjectType = "contact";
  const toObjectType = "company";
  //send the JSON of contact and company IDs to associate along with the object types to the batch associations API
  const apiResponse3 = await hubspotClient.crm.associations.batchApi.create(fromObjectType, toObjectType, JSON.parse(BatchInputPublicAssociation));
  //log the API response to the console for debugging
  console.log(JSON.stringify(apiResponse3.body, null, 2));
  
} catch (e) {
  e.message === 'HTTP request failed'
    ? console.error(JSON.stringify(e.response, null, 2))
    : console.error(e)
}
}
