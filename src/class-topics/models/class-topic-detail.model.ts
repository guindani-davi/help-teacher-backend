export class ClassTopicDetail {
  public readonly classTopicId: string;
  public readonly topicId: string;
  public readonly topicName: string;
  public readonly subjectId: string;
  public readonly subjectName: string;

  public constructor(
    classTopicId: string,
    topicId: string,
    topicName: string,
    subjectId: string,
    subjectName: string,
  ) {
    this.classTopicId = classTopicId;
    this.topicId = topicId;
    this.topicName = topicName;
    this.subjectId = subjectId;
    this.subjectName = subjectName;
  }
}
