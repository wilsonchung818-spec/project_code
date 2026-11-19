// Editorial source for Days 41–60. Slots follow the established 12-frame cycle.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'data', 'lessons.json');
const data = JSON.parse(fs.readFileSync(source, 'utf8'));
const templates = new Map();
for (const lesson of data.lessons) for (const section of lesson.sections) for (const sentence of section.sentences) {
  if (sentence.deconstruction && !templates.has(sentence.deconstruction.frame)) templates.set(sentence.deconstruction.frame, sentence);
}
// Each lesson: topic | scenario | speaking task, then four lines:
// two replaceable slots | natural alternative 1 | natural alternative 2.
const authored = `
Requirement Sign-off|The BA shares a requirement pack before business approval.|Explain who gets the requirement pack, check agreement, and name the next action.
The analyst|the product owner|The analyst sends the requirement pack to the product owner.|The product owner gets the requirements from the analyst.
The manager|her|The manager hands her the approval form.|She receives the approval form from the manager.
the requirement|clear|Does the requirement make sense?|Do we all understand what this requirement means?
The seats|available|There are still seats left.|We can still get seats.
Sprint Goal and Focus|The Scrum Master protects the sprint goal when an urgent request arrives.|State what needs attention, explain the sprint goal, and set a clear limit.
explain|the team|I need to explain the sprint goal to the team.|The team needs a clear explanation of the sprint goal from me.
show|the product owner|I'd like to show the new request to the product owner.|I want the product owner to see the new request.
check the sprint goal|this morning|I'll check the sprint goal this morning.|I plan to review the sprint goal this morning.
find|my phone|I don't know where my phone is.|My phone is missing.
Scope Change Request|A PM checks the cost and ownership of a proposed scope change.|Describe the change, identify its owner, and explain how it will be assessed.
The change|small|It's a small change.|The change is limited in size.
the client|request|This request comes from the client.|The client is asking for this change.
the analyst|the change request|I send the change request to the analyst.|I hand the change request over to the analyst.
our neighbor|a spare key|We leave a spare key with our neighbor.|Our neighbor keeps an extra key for us.
Acceptance Criteria|A BA shares acceptance criteria with QA before development starts.|Explain who reviews the criteria and ask whether they can be checked.
The developer|the tester|The developer sends the acceptance criteria to the tester.|The tester receives the acceptance criteria from the developer.
The tester|him|The tester hands him the test plan.|He gets the test plan from the tester.
the result|easy to check|Can we check the result easily?|Is there a clear way to check the result?
The shops|open|The shops are still open.|We can still go to the shops.
Cross-team Dependencies|A PM discusses a blocked task with a partner team.|Explain the dependency, ask for a date, and state what cannot proceed.
send|the other team|I need to send the dependency list to the other team.|The other team needs the dependency list from me.
explain|the project manager|I'd like to explain the delay to the project manager.|I want the project manager to understand the delay.
get a delivery date|tomorrow|I'll get a delivery date tomorrow.|I plan to confirm the delivery date tomorrow.
open|this jar|This jar won't open.|I can't get the lid off this jar.
Roadmap Alignment|A product manager reviews the next quarter's roadmap with the sponsor.|Summarize the plan, identify ownership, and explain how feedback is collected.
The plan|clear|The plan is easy to understand.|We have a clear plan.
the product team|roadmap|This roadmap belongs to the product team.|The product team owns this roadmap.
the sponsor|the latest plan|I share the latest plan with the sponsor.|I send the sponsor the updated plan.
our friend|a lift home|We drive our friend home.|Our friend gets a ride home with us.
Workshop Decisions|A BA closes a workshop by sharing the decision log and checking agreement.|Name who receives the decision log and check that the decision is final.
The facilitator|the sponsor|The facilitator sends the decision log to the sponsor.|The sponsor gets the decision log from the facilitator.
The sponsor|us|The sponsor gives us the final decision.|We receive the final decision from the sponsor.
the decision|final|Have we made a final decision?|Is that our final decision?
The tickets|on my phone|I've got the tickets on my phone.|My phone has the tickets on it.
Data Quality Checks|A BA reports missing data before a migration rehearsal.|Explain the data issue, share evidence, and set the next check.
report|the data owner|I need to report the data issue to the data owner.|The data owner needs to hear about the issue from me.
show|the test team|I'd like to show the missing data to the test team.|I want the test team to see which data is missing.
check the data|after lunch|I'll check the data after lunch.|I plan to review the data after lunch.
read|this small print|The print is too small for me to read.|I can't make out these tiny letters.
UAT Exit Decision|A PM reviews UAT results and prepares the exit decision.|Describe the evidence, name the business owner, and explain the sign-off route.
The test report|ready|The test report is complete.|We have the test report ready.
the business owner|decision|The decision rests with the business owner.|The business owner makes this decision.
the business owner|the test results|I share the test results with the business owner.|I send the business owner the results from testing.
our guests|fresh towels|We put out fresh towels for our guests.|Our guests get clean towels when they arrive.
Production Incident Updates|The incident lead shares an update during a service outage.|Say who receives the update and check whether the service is stable.
The incident lead|the support manager|The incident lead sends the status update to the support manager.|The support manager receives an update from the incident lead.
The engineer|her|The engineer hands her the error log.|She gets the error log from the engineer.
the service|stable|Is the service running normally now?|Has the service settled down?
The roads|clear|There's no traffic on the roads.|The roads are free of traffic.
Root Cause and Follow-up|A Scrum Master turns an incident review into a clear follow-up plan.|Share the cause, explain the next check, and avoid making an unsupported promise.
explain|the support team|I need to explain the cause to the support team.|The support team needs to understand the cause.
send|the service owner|I'd like to send the follow-up plan to the service owner.|I want the service owner to have the follow-up plan.
check the fix|this afternoon|I'll check the fix this afternoon.|I plan to test the fix this afternoon.
make|dinner tonight|I won't be able to cook tonight.|I can't cook dinner this evening.
Customer Feedback Review|A product manager reviews feedback with design and support.|Describe the feedback, name its source, and explain how it reaches the team.
The feedback|useful|We can use this feedback.|This feedback gives us something to work with.
the customer|main concern|This is the customer's biggest concern.|The customer is most concerned about this.
the designer|the customer notes|I share the customer notes with the designer.|I send the designer the notes from the customer call.
our host|a small gift|We bring our host a small gift.|We give a little present to the person hosting us.
Backlog Refinement|A BA and product owner prepare the next set of stories.|Explain the review route and check whether the story is small enough to discuss.
The analyst|the product owner|The analyst sends the revised story to the product owner.|The product owner receives the updated story from the analyst.
The product owner|them|The product owner gives them the priority list.|They get the priority list from the product owner.
the story|small enough|Have we made the story small enough?|Do we need to split this story further?
The bags|too heavy|These bags weigh too much.|We've packed too much into these bags.
Budget and Forecast|A PM reviews a cost increase and updates the forecast.|Explain the cost change, share the forecast, and name the next review date.
send|the finance team|I need to send the cost update to the finance team.|Finance needs the latest cost figures from me.
explain|the sponsor|I'd like to explain the cost increase to the sponsor.|I want the sponsor to understand why the cost has gone up.
check the forecast|on Friday|I'll check the forecast on Friday.|I plan to review the forecast on Friday.
pay|by card here|They don't take cards here.|I need to use cash here.
Vendor Delivery Review|A PM reviews a supplier's late delivery and the recovery plan.|Describe the delay, confirm responsibility, and explain the recovery plan.
The delivery|late|The delivery is behind schedule.|The delivery has missed the agreed date.
the vendor|responsibility|The vendor is responsible for this.|This is something the vendor needs to handle.
the vendor|the revised dates|I send the revised dates to the vendor.|I share the updated dates with the vendor.
our children|time to rest|We let our children have a rest.|We make sure our children get some downtime.
Change Communication|A change lead shares a staff message before a new process goes live.|Describe who gets the message and check whether it is clear for staff.
The change lead|the team manager|The change lead sends the staff message to the team manager.|The team manager gets the message from the change lead.
The manager|us|The manager shares the training plan with us.|We get the training plan from the manager.
the message|clear enough|Will people understand the message?|Do we need to make the message clearer?
The instructions|easy to follow|The instructions are straightforward.|It's easy to follow these instructions.
Retrospective Actions|A Scrum Master checks whether the last retrospective led to action.|Share evidence, set the next check, and explain one limit on the proposed action.
show|the team|I need to show the action log to the team.|The team needs to see the action log.
explain|the team lead|I'd like to explain the new approach to the team lead.|I want the team lead to understand the new approach.
check the action log|next Monday|I'll check the action log next Monday.|I plan to review our actions next Monday.
meet|before six|I'm not free until six.|Six is the earliest I can meet.
Benefits and Outcomes|A BA checks whether a released change is producing the expected result.|Describe the result, identify the owner, and explain what the evidence shows.
The result|better than expected|The result is better than we thought it would be.|We've done better than expected.
the service owner|target|This target belongs to the service owner.|The service owner is accountable for this target.
the sponsor|the latest figures|I share the latest figures with the sponsor.|I send the sponsor the most recent numbers.
our friends|a place to stay|We let our friends stay with us.|Our friends can stay at our place.
Release and Support Handover|A PM hands a release over to support and checks readiness.|Explain the handover route, confirm readiness, and name the next owner.
The release manager|the support lead|The release manager sends the runbook to the support lead.|The support lead gets the runbook from the release manager.
The support lead|him|The support lead hands him the on-call schedule.|He receives the on-call schedule from the support lead.
the support team|ready|Can the support team take over now?|Is support ready to take ownership?
The keys|on the table|You'll find the keys on the table.|I've left the keys on the table.
End-to-end Delivery Review|A BA, PM, and Scrum Master review the whole delivery and agree on next steps.|Give a 90-second delivery summary: result, evidence, unresolved risk, owner, and next check.
explain|the sponsor|I need to explain the delivery result to the sponsor.|The sponsor needs a clear account of the delivery result.
show|the whole team|I'd like to show the final report to the whole team.|I want everyone on the team to see the final report.
share the next steps|tomorrow|I'll share the next steps tomorrow.|I plan to walk everyone through the next steps tomorrow.
join|the call tonight|I won't be able to make the call tonight.|I'm not available for tonight's call.
`.trim().split('\n');
const additions=[];
for(let offset=0;offset<authored.length;offset+=5){
  const day=41+offset/5;
  const [topic,scenario,instruction]=authored[offset].split('|');
  const sentences=authored.slice(offset+1,offset+5).map((line,i)=>{
    const frame=((day-19)*4+i)%12+1;
    const [a,b,...examples]=line.split('|');
    const template=JSON.parse(JSON.stringify(templates.get(frame)));
    let slot=0;
    for(const segment of template.deconstruction.segments)if(segment.kind==='slot')segment.text=[a,b][slot++];
    template.text=template.deconstruction.segments.map(segment=>segment.text).join('');
    template.id=`S${i+1}`;template.context=i===3?'Life':'Work';template.examples=examples;
    return template;
  });
  additions.push({day,topic,scenario,level:'Senior workplace',speakingLogic:['Set the Context','Share the Evidence','Agree on Next Steps','Life Transfer'],sentencePatterns:sentences.map(s=>s.pattern),examples:['Name what each pronoun refers to. Keep the fixed grammar and swap the highlighted parts to fit your own situation.'],sections:[{title:'Work · 3 sentences',sentences:sentences.slice(0,3)},{title:'Life · 1 sentence',sentences:sentences.slice(3)}],speakingChallenge:{targetSeconds:day===60?90:60,instruction}});
}
data.lessons=[...data.lessons.filter(l=>l.day<=40),...additions];
data.contentVersion='2026.11.19';
fs.writeFileSync(source,JSON.stringify(data,null,2)+'\n');
console.log(`Wrote ${data.lessons.length} lessons; ${additions.length} new lessons.`);
