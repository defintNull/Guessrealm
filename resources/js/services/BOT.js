export function botChooseCharacter(photos) {
    const n = Math.floor(Math.random() * (photos.length));
    return photos[n];
}

export async function botChooseIfGuess(photos, difficulty) {
    let candidates = photos.filter(el => el?.state == false);
    if((difficulty == 0 && candidates.length <= 4) || candidates.length <= 2) {
        return true;
    }
    return false
}

export async function botGuess(photos, difficulty) {
    let candidates = photos.filter(el => el?.state == false);
    let n = 0;
    if(candidates.length != 0) {
        n = Math.floor(Math.random() * (candidates.length));
    } else {
        n = Math.floor(Math.random() * (photos.length));
    }
    return photos[n];
}

export async function botQuestionResponse(photo, question) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    return photo?.questions.find(el => el.id == question.id)?.response;
}

export async function botAskQuestion(photos, difficulty, questions) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    if(difficulty == 0) {
        const n = Math.floor(Math.random() * (questions.length));
        return questions[n];
    } else if(difficulty == 1) {
        let map = questions.map(el => {
            return {
                id: el?.id,
                count: 0
            }
        });
        photos.forEach(el => {
            el?.questions.forEach(q => {
                if(q?.response) {
                    const item = map.find(m => m.id === q.id);
                    if (item) {
                        item.count++;
                    }
                }
            });
        });
        let sorted = [...map].sort((a, b) => a.count - b.count);
        let mid = Math.floor(sorted.length / 2);
        let medianItem = sorted[mid];
        return questions.find(el => el.id === medianItem.id);
    } else {
        let map = questions.map(el => {
            return {
                id: el?.id,
                count: 0
            }
        });
        photos.forEach(el => {
            el?.questions.forEach(q => {
                if(q?.response) {
                    const item = map.find(m => m.id === q.id);
                    if (item) {
                        item.count++;
                    }
                }
            });
        });
        let maxItem = map.reduce((max, item) => item.count > max.count ? item : max );
        return questions.find(el => (el.id == maxItem.id));
    }
}

export async function botRegisterResponse(photos, question, response) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    return photos.map(el => {
        if(el?.questions.find(el2 => el2.id == question.id)?.response != response) {
            el.state = true;
        }
        return el;
    })
}
