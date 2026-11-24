// Editorial source: repeat useful answer frames across different work and life situations.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const course = JSON.parse(fs.readFileSync(path.join(root, 'data/lessons.json'), 'utf8'));
const patterns = {};
function P(id, template, purpose, guidance, examples) { patterns[id] = { id, template, purpose, guidance, examples }; }
P('goal', 'We want [WHO] to [ACTION].', '说明目标', 'WHO 填人或团队；ACTION 填动词原形开头的动作。', [['users','find their orders easily'],['our guests','feel at home']]);
P('need', 'We need [THING] before we can [ACTION].', '说明前置条件', 'THING 填名词词组；ACTION 填动词原形词组。', [['test data','check the new form'],['the address','book a taxi']]);
P('check', "Let's check [THING] with [PERSON] first.", '先核对再行动', 'THING 填待确认事项；PERSON 填需要沟通的人。', [['the scope','the product owner'],['the time','our friends']]);
P('if', 'If [CONDITION], we can [ACTION].', '提出有条件的方案', 'CONDITION 填一般现在时完整句子；ACTION 填动词原形词组。', [['the tests pass','release the update'],['the weather is good','eat outside']]);
P('notyet', 'Not yet. We still need to [ACTION].', '解释尚未完成的事项', 'ACTION 填动词原形词组；用于回答是否完成、是否就绪。', [['confirm the owner'],['buy the train tickets']]);
P('first', "Let's [FIRST] first, then [NEXT].", '安排先后顺序', 'FIRST 和 NEXT 都填动词原形词组。', [['agree on the goal','discuss the details'],['check the menu','book a table']]);
P('cause', "We can't [ACTION] because [REASON].", '说明阻塞原因', 'ACTION 填动词原形；REASON 填有主语和谓语的完整句子。', [['start testing','the account is locked'],['leave yet','the taxi is late']]);
P('plan', "I'll [ACTION] by [TIME].", '承诺行动与截止时间', 'ACTION 填动词原形词组；TIME 填截止时间，by 表示不晚于。', [['send the notes','five today'],['pick up the groceries','six tonight']]);
P('share', "I'll share [THING] with [PERSON].", '把信息交给需要的人', '两个位置均填名词词组，PERSON 可以是团队。', [['the test results','the business owner'],['the address','our guests']]);
P('know', 'We need to know [DETAIL].', '澄清需要的信息', 'DETAIL 填陈述语序的间接问句，如 who owns this 或 when it is due。', [['who owns this task'],['when the last train leaves']]);
P('impact', 'This affects [WHO], so we need to [ACTION].', '说明影响并提出行动', 'WHO 填受影响对象；ACTION 填动词原形词组。', [['the support team','check the extra workload'],['everyone coming to dinner','confirm the new time']]);
P('expected', 'The system should [ACTION] when [CONDITION].', '描述可测试的系统行为', 'ACTION 填动词原形；CONDITION 填完整的一般现在时从句。', [['show an error','a required field is empty'],['send a message','the payment goes through']]);
P('wait', "We're waiting for [PERSON] to [ACTION].", '说明依赖谁完成什么', 'PERSON 填人或团队；ACTION 填他们要做的动作。', [['the data team','send the file'],['our friends','arrive']]);
P('can', 'We can [ACTION], but we still need to [NEXT].', '说明能做什么及剩余条件', 'ACTION 和 NEXT 都用动词原形词组。', [['test the form','check the payment flow'],['book the hotel','confirm the flights']]);
P('depends', "That depends on [THING]. Let's [ACTION].", '避免过早承诺', 'THING 填影响条件的名词词组；ACTION 填核实动作。', [['the test results','check with QA'],['the weather','look at the forecast']]);
P('until', "I can't [ACTION] until [CONDITION].", '说明个人行动的前置条件', 'ACTION 用动词原形；CONDITION 用现在时完整句子表示将来条件。', [['confirm the date','the team checks the estimate'],['leave','my meeting ends']]);
P('finding', 'I found [ISSUE] in [PLACE].', '报告具体发现', 'ISSUE 和 PLACE 都用名词词组；保持问题具体。', [['two missing fields','the form'],['a mistake','the bill']]);
P('owner', '[PERSON] is checking [THING].', '说明谁在处理什么', 'PERSON 用单数人员或团队名称，固定搭配 is checking。', [['The business owner','the open questions'],['My friend','the train times']]);
P('let', "Let me [ACTION], then I'll [NEXT].", '接下问题并给出下一步', '两个位置均用动词原形词组。', [['check the details','get back to you'],['check the address','send you the route']]);
P('option', 'We could [ACTION] instead of [OTHER].', '提出替代方案', 'ACTION 用动词原形；OTHER 用动词 ing 形式开头。', [['split the story','delaying the whole release'],['take the train','driving']]);
P('ready', '[THING] is ready for [NEXT].', '确认某项准备就绪', 'THING 用单数名词或不可数名词；NEXT 用名词词组或 ing 形式。', [['The report','review'],['Dinner','serving']]);
P('still', "We're still checking [THING]. I'll update you [TIME].", '在信息不完整时给出更新时间', 'THING 填待核实事项；TIME 用完整时间短语，如 in ten minutes。', [['the cause','in fifteen minutes'],['the travel plans','this evening']]);
P('agree', "We've agreed on [THING], but [ISSUE].", '区分已确认和未解决事项', 'THING 用名词词组；ISSUE 用完整陈述句。', [['the scope','the date is still open'],['the restaurant','we still need to book']]);
P('clarify', "I'd like to confirm [THING] before we [ACTION].", '在开展工作前确认边界', 'THING 用名词词组；ACTION 用动词原形词组。', [['the acceptance criteria','start development'],['the cost','book the trip']]);
P('keep', "Let's keep [THING] and change [OTHER].", '说明哪些保留、哪些调整', '两个位置均用名词词组。', [['the sprint goal','the order of the tasks'],['the booking','the arrival time']]);
P('location', '[THING] is [PLACE].', '说明物品或信息的位置', 'THING 用单数名词或不可数名词；PLACE 用 on / in / by 等开头的位置词组。', [['The latest report','in the shared folder'],['My phone','on the kitchen table']]);
P('have', "I've [DONE], so we can [ACTION].", '说明已完成事项带来的结果', 'DONE 用过去分词词组，如 saved the file；ACTION 用动词原形。', [['saved the report','review it offline'],['booked a table','go straight to the restaurant']]);
P('help', 'I can [ACTION] if you [CONDITION].', '提供有条件的帮助', 'ACTION 用动词原形；CONDITION 是接在 you 后的现在时谓语。', [['check the issue','send me the error message'],['give you a ride','finish by six']]);
P('please', 'Please [ACTION] so we can [RESULT].', '提出请求并说明目的', 'ACTION 和 RESULT 都用动词原形词组。', [['confirm the owner','move this forward'],['send me the address','find the house']]);
P('time', "It should take about [TIME]. I'll [ACTION].", '给出时间估计与行动', 'TIME 用一段时长；ACTION 用动词原形。should 表示估计，不是保证。', [['ten minutes','send an update when it is done'],['half an hour','call you when I arrive']]);
P('reason', '[CHOICE] is more important because [REASON].', '解释优先级理由', 'CHOICE 用单数名词词组；REASON 用完整句子。', [['The login fix','users cannot access their accounts'],['The roof repair','water is coming into the house']]);
P('risk', "There's a risk that [RISK], so let's [ACTION].", '提醒风险并提出应对', 'RISK 填完整句子；ACTION 用动词原形。', [['the file will be late','agree on a backup plan'],['we will miss the train','leave a little earlier']]);
P('note', "I'll make a note of [THING] and [ACTION].", '记录事项并安排跟进', 'THING 用名词词组；ACTION 用动词原形，与 make 并列。', [['the open question','check it with the owner'],['the booking number','keep it on my phone']]);
P('test', "We'll check [THING] against [STANDARD].", '说明核对方法', '两处均为名词词组；against 表示对照标准。', [['the results','the acceptance criteria'],['the bill','the prices on the menu']]);
P('follow', "I'll follow up with [PERSON] about [THING].", '跟进负责人和事项', 'PERSON 填人或团队；THING 填待跟进事项。', [['the vendor','the delivery date'],['the hotel','our booking']]);
P('target', "That's our target, but we haven't confirmed [DETAIL] yet.", '区分目标和已确认承诺', 'DETAIL 填尚未确认的名词词组。', [['the release date'],['the travel dates']]);

// scene | your role | partner | Q1 | pattern~slot~slot | Q2 | pattern~slot~slot
const authored = `
42
对齐冲刺目标|SM|Developer|What's our main goal for this sprint?|goal~users~reset their passwords without calling support|How will we know we've met that goal?|test~the full reset flow~the agreed acceptance criteria
临时插入需求|SM|Product owner|Can we fit this new request into the sprint?|check~its value and impact~the team|What if it really can't wait?|if~it cannot wait~review the scope together while keeping the sprint goal
跟进站会阻塞|SM|Developer|Why can't QA start the login test?|cause~start the login test~the test account isn't ready|Should we discuss the details now?|first~finish the daily scrum~have a quick chat with QA
出门前找手机|You|Friend|Are you ready to leave?|until~leave~I find my phone|How can I help?|please~call my number~hear where the phone is
43
澄清导出需求|BA|Business user|Can we add an export button to this page?|clarify~what users need to export~agree on the change|What do you need to know?|know~which fields they need and how they will use the file
评估小改动|SM|Stakeholder|It's just one extra field. Can we finish it today?|need~the team's estimate~give you a date|What needs to be checked?|check~the screen, the data, and the tests~the developers
确认变更审批|BA|Developer|Is this change approved?|notyet~get the product owner's decision|What information is missing?|know~why the change is needed and when users need it
请邻居帮忙|You|Neighbor|What do you need me to do while you're away?|please~water the plants twice~keep them healthy|How will I get into the house?|plan~leave you a spare key~Friday morning
44
定义可检查结果|BA|Tester|What should happen when a user submits the form?|expected~save the record and show a message~the user submits a valid form|How will we check the result?|test~the saved record and the message~the acceptance criteria
补充异常情况|BA|Developer|What if the email address is already in use?|expected~show an error~the email address is already in use|Is that in the acceptance criteria?|notyet~add that case and confirm it with the product owner
统一开发测试理解|SM|Product owner|Are development and QA clear on the expected result?|agree~the main flow~they understand the last rule differently|How can we clear that up?|first~walk through one example together~update the rule
买菜前确认营业|You|Partner|Can we go to the supermarket now?|if~we leave now~get there before it closes|What should we do before we leave?|first~check what we already have~make a short shopping list
45
说明跨团队依赖|SM|Developer|What's holding up the API tests?|wait~the API team~give us access to the test environment|What should I send them?|please~send them the test account details~get access set up
解释数据延误影响|BA|Business owner|What happens if the data arrives late?|cause~test the full order process~the payment data will be missing|Can we still test part of it?|can~test the form~check the payment flow once the data arrives
跟进交付日期|SM|Product owner|Has the other team confirmed a date?|notyet~get a date from their lead|What will you do next?|follow~their lead~the delivery date and any support they need
打不开瓶盖|You|Partner|Do you need a hand with that jar?|until~use the sauce~I get the lid off|Would a towel help?|let~try using a towel~ask you for a hand if it is still stuck
46
解释业务优先级|BA|Stakeholder|Why are we doing order checks before the dashboard?|reason~The order check~staff spend hours on it every day|What result are we aiming for?|goal~staff~check an order in under a minute
避免过早承诺日期|SM|Stakeholder|Can we promise this feature by the end of next month?|need~the team's estimate and the dependency dates~confirm delivery|Can we still use next month as a target?|target~the delivery date
同步路线图变化|BA|Business lead|Has the business team seen the updated roadmap?|notyet~share the latest version with them|How will they know what's changed?|share~a short summary of the new priorities and dates~the business team
顺路送朋友|You|Friend|Could you give me a ride home?|help~give you a ride~are ready in ten minutes|Should I wait outside?|please~wait by the main entrance~find each other easily
47
确认工作坊结论|BA|Business owner|Have we agreed on the approval process?|agree~the main steps~the manager's absence is still an open point|What do we need to settle?|know~who can approve a request when the manager is away
把讨论拉回主题|SM|Participant|Should we discuss the dashboard design now too?|first~finish the approval process~set a time for the dashboard|How will we make sure it doesn't get lost?|note~the dashboard topic~add it to our follow-up list
明确行动项|BA|Facilitator|Who will check the exception with the business team?|follow~the business owner~who can approve requests when the manager is away|When will you update us?|plan~update the decision log~tomorrow morning
使用电子票|You|Friend|Do we need to print our tickets?|have~saved the tickets on my phone~show them at the entrance|What if your battery runs out?|share~a copy of the tickets~you before we leave
48
报告数据问题|BA|Data owner|What did you find in the customer file?|finding~some missing delivery addresses~the customer file|Why does that matter?|cause~send an order~we don't have a complete address
核对去重规则|BA|Developer|These records share an email. Should we delete one?|check~the business rule~the data owner|What do we need to confirm?|know~whether two customers can share one email address
推动修复与复查|SM|Tester|Who is looking into the missing addresses?|owner~The data owner~the missing addresses with the business team|When should we run the checks again?|if~the updated file is ready~run the checks again with QA
看不清标签|You|Partner|Can you read the date on this label?|until~read the date~I get a closer look|Would taking a photo help?|let~take a photo~zoom in on the date
49
汇报UAT结果|BA|Business owner|Are the UAT results ready?|ready~The UAT report~your review|Can we close UAT now?|notyet~review the failed refund case with you
说明未解决问题|BA|Product owner|What's the impact of the refund issue?|impact~customers who need a refund~check a safe workaround|Can support handle refunds manually?|can~ask support to handle them~check the extra workload and get business approval
跟进业务签字|SM|Developer|Who is reviewing the open UAT issues?|owner~The business owner~the results and the remaining risks|Have we got a decision yet?|notyet~get a written decision from the business owner
招待留宿客人|You|Guest|Could I have a clean towel?|location~A fresh towel~on the shelf in the bathroom|Where should I leave the used one?|please~put it in the basket~keep the bathroom tidy
50
确认故障影响|BA|Support lead|What are users seeing?|cause~complete orders~the payment page keeps timing out|Is everyone affected?|still~how many users are affected~in fifteen minutes
协调故障排查|SM|Business user|Who is checking the error logs?|owner~The support engineer~the error logs|What do you need from us?|please~send a failed order number and the time~help the engineer trace the issue
提供可靠进展|BA|Stakeholder|Is the service back to normal?|can~see the fix in production~check that orders go through|When will we get another update?|plan~share the latest results~three this afternoon
路上堵车|You|Friend|Are we going to be late?|risk~we will arrive late~take the other route|How much longer will that take?|time~ten more minutes~let our host know we're on our way
51
区分原因与猜测|BA|Stakeholder|Do we know why the orders failed?|still~the cause of the failure~after the engineer's review|What can we confirm now?|share~the error times and affected orders~the support lead
推动根因讨论|SM|Developer|Should we focus on who made the mistake?|first~understand how the issue happened~agree on a change to prevent it|What should we bring to the review?|need~the timeline and the logs~understand what happened
跟踪改进措施|SM|Product owner|Has the follow-up action been completed?|notyet~check whether the new alert works|When will you follow up?|plan~review the alert check with the team~Friday afternoon
晚餐安排变化|You|Partner|Can you cook tonight?|until~cook~I finish this call|What should we do instead?|option~order something simple~cooking a full meal
52
澄清客户反馈|BA|Customer|The search page is confusing. Can you improve it?|clarify~which part is confusing~choose a solution|What would help you understand the problem?|please~show me the last search you tried~see where it became difficult
验证实际需求|BA|Product owner|Should we add more filters?|check~the main search problem~a few users first|Why not just build the filters?|risk~we will solve the wrong problem~check what users really need
把反馈转为行动|SM|Designer|How can we share what we learned?|share~the customer notes and examples~the whole team|What should we do after that?|first~agree on the main problem~choose one small change to try
给朋友选礼物|You|Partner|Should we buy our host something expensive?|option~bring a small gift~spending too much|What should we check first?|check~what they like~our friend
53
拆分过大故事|BA|Developer|This story covers three user journeys. Can we split it?|option~start with the main journey~building all three at once|How do we choose which one comes first?|check~which journey brings the most value~the product owner
补齐故事信息|BA|Tester|Is this story ready for the team to discuss?|notyet~add an example of the expected result|What would make that example useful?|need~a clear input and output~agree on how to test it
控制梳理会议范围|SM|Product owner|Can we review the whole backlog today?|first~review the next few items~decide what else needs attention|What if we run out of time?|note~the remaining questions~set up a short follow-up
收拾旅行行李|You|Partner|These bags are too heavy. What can we leave out?|option~pack fewer shoes~taking a pair for every day|Should we keep the raincoat?|keep~the raincoat~the heavy bag for a lighter one
54
澄清成本增加|BA|Business owner|Why has the estimate gone up?|impact~the data migration work~allow time for extra checks|What information can you share?|share~the changed assumptions and extra work~the finance team
区分预测和承诺|SM|Stakeholder|Can the team still finish within the original budget?|depends~the remaining work~review it with the team|When can you confirm the forecast?|until~confirm the forecast~the team reviews the new scope
记录预算决策|BA|Sponsor|What do you need before we approve the extra cost?|need~the cost breakdown and expected benefit~compare the options|Who will collect those details?|plan~bring the figures together~Thursday afternoon
店里不能刷卡|You|Partner|Can we pay by card here?|cause~pay by card~their card machine isn't working|What should we do?|let~check whether they take phone payments~get cash if we need it
55
跟进供应商延期|SM|Product owner|Has the vendor sent the test file?|wait~the vendor~send the agreed test file|What will you ask them?|follow~their delivery lead~the reason for the delay and a realistic date
澄清交付物差距|BA|Vendor|Is the file we sent good enough for testing?|finding~two missing fields~the sample file|What do you want us to do?|please~add the customer ID and order date~test the full flow
安排备选方案|SM|Developer|What if the vendor misses the new date?|risk~testing will slip~agree on a backup plan|Could we use sample data in the meantime?|can~test some cases with sample data~check the real file before sign-off
给孩子安排休息|You|Partner|Should we start homework as soon as we get home?|first~give the children time to rest~start the homework|How much time should we give them?|time~twenty minutes~get a snack ready while they rest
56
明确变更通知内容|BA|Business lead|What should we tell staff about the new process?|need~a clear explanation of what changes~send the message|What else should the message include?|know~when it starts and where staff can get help
验证通知是否易懂|BA|Change lead|Is the draft clear enough to send?|check~the wording~a few staff members first|What should we ask them to do?|please~ask them to explain the change in their own words~see whether the message is clear
协调培训与上线|SM|Support lead|Can we go live before the training is done?|risk~staff will not know what to do~review the timing together|What could we change?|option~run a short training session first~leaving staff to work it out
帮家人使用新设备|You|Parent|Do I need to read the whole guide first?|first~check the quick-start page~try the basic settings|What if I get stuck?|help~walk you through it~tell me which step you're on
57
检查回顾行动效果|SM|Developer|Did the last retrospective action help?|still~whether review time has improved~at the next retrospective|What evidence will you use?|test~this week's review times~last week's figures
让改进行动更具体|SM|Team member|Can we write 'communicate better' as our action?|clarify~what we will do differently~add it to the action list|What would a clearer action look like?|option~post a short update when work is blocked~waiting for the next meeting
确认行动负责人|SM|Product owner|Who's following up on the new review checklist?|owner~The team lead~whether the checklist is being used|How will we keep track of it?|note~the owner and review date~check progress next Monday
下班后约朋友|You|Friend|Can we meet at five?|until~meet~my call ends at six|Would six thirty work?|if~the call ends on time~meet at the cafe at six thirty
58
核对业务收益|BA|Sponsor|Has the new process saved staff time?|still~the time saved per order~after we review this week's data|How will you measure the change?|test~the new processing times~the figures from before the release
明确指标口径|BA|Business owner|Can we use the number of completed orders as our measure?|clarify~what counts as a completed order~compare the figures|What do you mean?|know~whether cancelled orders are included in the total
把结果带回团队|SM|Product owner|Should we start another improvement straight away?|first~review what changed for users~choose the next improvement|How will the team see the results?|share~the business results and user feedback~the team at the review
让朋友在家里留宿|You|Friend|Would it be okay if we stayed at your place?|help~get the spare room ready~let me know when you're arriving|What time should we get there?|if~you arrive after six~have dinner together
59
确认运维交接内容|BA|Support lead|Is the handover pack complete?|ready~The runbook~your review|What should we check before we accept it?|need~the support contacts and recovery steps~complete the handover
明确上线后负责人|SM|Developer|Who will handle issues after the release?|owner~The support lead~the on-call schedule and contact list|What if an issue needs the development team?|please~use the agreed support route~get it to the right person quickly
确认支持准备|SM|Product owner|Is the support team ready to take over?|notyet~walk them through the recovery steps|When will that happen?|plan~arrange the handover session~tomorrow afternoon
把钥匙留给家人|You|Partner|Where have you put the spare key?|location~The spare key~in the top drawer by the door|What if I can't find it?|help~show you where it is~call me before you leave
60
总结交付结果|BA|Sponsor|What did this release achieve?|have~made the order check simpler~reduce manual work for staff|What do we still need to confirm?|still~the actual time saved~in next week's report
说明剩余风险|SM|Stakeholder|Are there any risks left after the release?|risk~the overnight file will arrive late~keep the extra checks for now|Who is watching that?|owner~The support lead~the file arrival time each morning
约定后续行动|BA|Product owner|What should we do next?|first~review the business results~agree on the next small improvement|When will you share the next steps?|plan~send the action summary~tomorrow afternoon
参加不了晚上的通话|You|Friend|Can you join the call tonight?|until~join a call~I get home, which will be quite late|Could we speak tomorrow instead?|if~you're free after dinner~have a quick call tomorrow
`.trim().split('\n');

function fill(template, values) { let i = 0; return template.replace(/\[[^\]]+\]/g, () => values[i++]); }
function answer(spec, speaker) {
  const [id, ...values] = spec.split('~');
  const p = patterns[id];
  if (!p) throw new Error(`Unknown pattern ${id}`);
  const labels = [...p.template.matchAll(/\[([^\]]+)\]/g)].map(m => m[1]);
  if (values.length !== labels.length) throw new Error(`Wrong slots: ${spec}`);
  let i = 0;
  const segments = p.template.split(/(\[[^\]]+\])/).filter(Boolean).map(part => part.startsWith('[') ? {kind:'slot', label:labels[i], text:values[i++]} : {kind:'fixed', text:part});
  const text = fill(p.template, values);
  const examples = p.examples.map(v => fill(p.template, v));
  return {speaker, text, reuse:{patternId:id, purpose:p.purpose, template:p.template, guidance:p.guidance, segments, examples}};
}
let day, index;
for (const line of authored) {
  if (/^\d+$/.test(line)) {day = Number(line); index = 0; continue;}
  const [scene, role, partner, q1, a1, q2, a2] = line.split('|');
  if (!a2) throw new Error(`Invalid scene: ${line}`);
  const turns=[{speaker:'Q1',text:q1},answer(a1,'A1'),{speaker:'Q2',text:q2},answer(a2,'A2')];
  const lesson=course.lessons.find(l=>l.day===day);
  if(index===0){
    lesson.sections=[{title:'Work · 3 dialogues',sentences:[]},{title:'Life · 1 dialogue',sentences:[]}];
    lesson.format='reusable-dialogues';
    lesson.speakingLogic=['Listen to the Question','Answer with a Frame','Handle the Follow-up','Swap and Reuse'];
    lesson.examples=['Practise both answers. Change a highlighted part, then use the same frame in a new situation.'];
    lesson.speakingChallenge={targetSeconds:90,instruction:'Choose one work dialogue. Answer both questions without looking, then change the people, objects, or timing and repeat it in your own work context.'};
  }
  const sentence={id:`S${index+1}`,context:index===3?'Life':'Work',text:turns[1].text,pattern:turns[1].reuse.template,examples:turns[1].reuse.examples,dialogue:{scene,role,partner,turns}};
  lesson.sections[index===3?1:0].sentences.push(sentence);
  index++;
  lesson.sentencePatterns=lesson.sections.flatMap(s=>s.sentences.map(t=>t.pattern));
}
course.contentVersion='2026.11.24';
course.contentMethod='Basic English inspired; Days 19–41 use 12 diagnostic frames; Days 42–60 practise reusable answers in two-round dialogues.';
fs.writeFileSync(path.join(root,'data/lessons.json'),JSON.stringify(course,null,2)+'\n');
const lines=['# BA Speak · Days 42–60','', '每个 S：Q1 → A1 → Q2 → A2。Q 是对方，A 是你的回答。每个回答提供句型、替换规则和两个跨场景例句。',''];
for(const lesson of course.lessons.filter(l=>l.day>=42)){
  lines.push(`## Day ${lesson.day} · ${lesson.topic}`,'');
  for(const s of lesson.sections.flatMap(section=>section.sentences)){
    lines.push(`### ${s.id} · ${s.dialogue.scene}`,`你的角色：${s.dialogue.role}；对方：${s.dialogue.partner}`,'');
    for(const t of s.dialogue.turns)lines.push(`**${t.speaker}:** ${t.text}`,'');
    for(const t of s.dialogue.turns.filter(t=>t.reuse)){
      lines.push(`#### ${t.speaker} 复用 · ${t.reuse.purpose}`,`句型：${t.reuse.template}`,'',t.reuse.guidance,'',...t.reuse.examples.map(e=>`- ${e}`),'');
    }
  }
}
fs.mkdirSync(path.join(root,'docs'),{recursive:true});
fs.writeFileSync(path.join(root,'docs/dialogues-42-60.md'),lines.join('\n')+'\n');
console.log('Updated 76 dialogues, 152 reusable answers, and the review document.');
